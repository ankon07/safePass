import { ethers } from 'ethers';
import { EventEmitter } from 'events';

// Import contract artifacts
import EmploymentContractArtifact from '../../../artifacts/contracts/EmploymentContract.sol/EmploymentContract.json';
import EthereumDIDRegistryArtifact from '../../../artifacts/contracts/EthereumDIDRegistry.sol/EthereumDIDRegistry.json';
import AnchorArtifact from '../../../artifacts/contracts/Anchor.sol/Anchor.json';

interface ContractConfig {
  address: string;
  abi: any[];
}

interface TransactionOptions {
  gasLimit?: number;
  gasPrice?: string;
  value?: string;
}

interface EventFilter {
  contractAddress: string;
  eventName: string;
  fromBlock?: number;
  toBlock?: number;
}

class BlockchainService extends EventEmitter {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contracts: Map<string, ethers.Contract> = new Map();
  private eventListeners: Map<string, any> = new Map();

  constructor() {
    super();
    
    // Initialize provider and wallet
    this.provider = new ethers.JsonRpcProvider(process.env.BESU_RPC_URL || 'http://localhost:8545');
    
    if (!process.env.REGULATOR_PRIVATE_KEY) {
      throw new Error('REGULATOR_PRIVATE_KEY environment variable is required');
    }
    
    this.wallet = new ethers.Wallet(process.env.REGULATOR_PRIVATE_KEY, this.provider);
    
    console.log('BlockchainService initialized with wallet:', this.wallet.address);
  }

  /**
   * Register a smart contract for easy access
   */
  registerContract(name: string, config: ContractConfig): void {
    const contract = new ethers.Contract(config.address, config.abi, this.wallet);
    this.contracts.set(name, contract);
    console.log(`Registered contract ${name} at ${config.address}`);
  }

  /**
   * Get a registered contract
   */
  getContract(name: string): ethers.Contract {
    const contract = this.contracts.get(name);
    if (!contract) {
      throw new Error(`Contract ${name} not registered`);
    }
    return contract;
  }

  /**
   * Execute a contract method with automatic gas estimation and nonce management
   */
  async executeContractMethod(
    contractName: string,
    methodName: string,
    args: any[] = [],
    options: TransactionOptions = {}
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      const contract = this.getContract(contractName);
      
      // Get current nonce
      const nonce = await this.provider.getTransactionCount(this.wallet.address, 'pending');
      
      // Estimate gas if not provided
      let gasLimit = options.gasLimit;
      if (!gasLimit) {
        try {
          const estimatedGas = await contract[methodName].estimateGas(...args);
          gasLimit = Math.floor(Number(estimatedGas) * 1.2); // Add 20% buffer
        } catch (error) {
          console.warn('Gas estimation failed, using default:', error);
          gasLimit = 500000; // Default gas limit
        }
      }

      // Get gas price if not provided
      let gasPrice = options.gasPrice;
      if (!gasPrice) {
        const feeData = await this.provider.getFeeData();
        gasPrice = feeData.gasPrice?.toString() || '20000000000'; // 20 gwei default
      }

      // Execute transaction
      const tx = await contract[methodName](...args, {
        nonce,
        gasLimit,
        gasPrice,
        value: options.value || '0'
      });

      console.log(`Transaction sent: ${tx.hash}`);
      console.log(`Method: ${contractName}.${methodName}`);
      console.log(`Args:`, args);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      // Emit event for listeners
      this.emit('transactionConfirmed', {
        contractName,
        methodName,
        args,
        txHash: tx.hash,
        receipt
      });

      return tx;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error executing ${contractName}.${methodName}:`, error);
      
      // Emit error event
      this.emit('transactionError', {
        contractName,
        methodName,
        args,
        error: errorMessage
      });
      
      throw error;
    }
  }

  /**
   * Call a read-only contract method
   */
  async callContractMethod(
    contractName: string,
    methodName: string,
    args: any[] = []
  ): Promise<any> {
    try {
      const contract = this.getContract(contractName);
      const result = await contract[methodName](...args);
      
      console.log(`Called ${contractName}.${methodName} with result:`, result);
      return result;
    } catch (error) {
      console.error(`Error calling ${contractName}.${methodName}:`, error);
      throw error;
    }
  }

  /**
   * Listen for contract events
   */
  startEventListener(
    contractName: string,
    eventName: string,
    callback: (event: any) => void
  ): void {
    const contract = this.getContract(contractName);
    const listenerKey = `${contractName}.${eventName}`;
    
    // Remove existing listener if any
    if (this.eventListeners.has(listenerKey)) {
      const oldListener = this.eventListeners.get(listenerKey);
      contract.off(eventName, oldListener);
    }
    
    // Add new listener
    const listener = (...args: any[]) => {
      const event = args[args.length - 1]; // Last argument is the event object
      console.log(`Event ${contractName}.${eventName} received:`, event);
      callback(event);
    };
    
    contract.on(eventName, listener);
    this.eventListeners.set(listenerKey, listener);
    
    console.log(`Started listening for ${contractName}.${eventName} events`);
  }

  /**
   * Stop listening for contract events
   */
  stopEventListener(contractName: string, eventName: string): void {
    const contract = this.getContract(contractName);
    const listenerKey = `${contractName}.${eventName}`;
    
    if (this.eventListeners.has(listenerKey)) {
      const listener = this.eventListeners.get(listenerKey);
      contract.off(eventName, listener);
      this.eventListeners.delete(listenerKey);
      console.log(`Stopped listening for ${contractName}.${eventName} events`);
    }
  }

  /**
   * Get past events from a contract
   */
  async getPastEvents(
    contractName: string,
    eventName: string,
    fromBlock: number = 0,
    toBlock: number | string = 'latest'
  ): Promise<any[]> {
    try {
      const contract = this.getContract(contractName);
      
      // Check if the event exists in the contract's filters
      if (!contract.filters || typeof contract.filters[eventName] !== 'function') {
        throw new Error(`Event '${eventName}' not found in contract '${contractName}'. Available events: ${Object.keys(contract.filters || {}).join(', ')}`);
      }
      
      // Get current block number to validate range
      const currentBlock = await this.getCurrentBlockNumber();
      console.log(`Current blockchain block: ${currentBlock}`);
      
      // Convert and validate block parameters
      let actualFromBlock = Math.max(0, Number(fromBlock));
      let actualToBlock: number;
      
      if (toBlock === 'latest') {
        actualToBlock = currentBlock;
      } else {
        actualToBlock = Number(toBlock);
      }
      
      // Validate block range against current blockchain state
      if (actualFromBlock > currentBlock) {
        throw new Error(`fromBlock (${actualFromBlock}) is greater than current block (${currentBlock}). Current blockchain only has ${currentBlock + 1} blocks.`);
      }
      
      if (actualToBlock > currentBlock) {
        console.log(`toBlock (${actualToBlock}) is greater than current block (${currentBlock}), adjusting to current block`);
        actualToBlock = currentBlock;
      }
      
      if (actualFromBlock > actualToBlock) {
        throw new Error(`fromBlock (${actualFromBlock}) cannot be greater than toBlock (${actualToBlock})`);
      }
      
      // Limit the range to avoid RPC limits (max 1000 blocks)
      const blockRange = actualToBlock - actualFromBlock;
      if (blockRange > 1000) {
        actualFromBlock = actualToBlock - 1000;
        console.log(`Block range too large (${blockRange} blocks), limiting to last 1000 blocks: ${actualFromBlock} to ${actualToBlock}`);
      }
      
      console.log(`Querying events from block ${actualFromBlock} to ${actualToBlock} (range: ${actualToBlock - actualFromBlock + 1} blocks)`);
      
      const filter = contract.filters[eventName]();
      const events = await contract.queryFilter(filter, actualFromBlock, actualToBlock);
      
      console.log(`Found ${events.length} ${contractName}.${eventName} events from block ${actualFromBlock} to ${actualToBlock}`);
      return events;
    } catch (error) {
      console.error(`Error getting past events for ${contractName}.${eventName}:`, error);
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('invalid blockTag')) {
          const currentBlock = await this.getCurrentBlockNumber().catch(() => 'unknown');
          throw new Error(`Invalid block range. Current blockchain has ${currentBlock} blocks. Please use a valid range like fromBlock=0&toBlock=latest or fromBlock=0&toBlock=${currentBlock}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Get current block number
   */
  async getCurrentBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null> {
    return await this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  /**
   * Initialize default contracts
   */
  async initializeDefaultContracts(): Promise<void> {
    try {
      // Register EmploymentContract if address is available
      if (process.env.EMPLOYMENT_CONTRACT_ADDRESS) {
        this.registerContract('EmploymentContract', {
          address: process.env.EMPLOYMENT_CONTRACT_ADDRESS,
          abi: EmploymentContractArtifact.abi
        });
      }

      // Register DID Registry if address is available
      if (process.env.DID_REGISTRY_ADDRESS) {
        this.registerContract('EthereumDIDRegistry', {
          address: process.env.DID_REGISTRY_ADDRESS,
          abi: EthereumDIDRegistryArtifact.abi
        });
      }

      // Register Anchor contract if address is available
      if (process.env.ANCHOR_CONTRACT_ADDRESS) {
        this.registerContract('Anchor', {
          address: process.env.ANCHOR_CONTRACT_ADDRESS,
          abi: AnchorArtifact.abi
        });
      }

      console.log('Default contracts initialized');
    } catch (error) {
      console.error('Error initializing default contracts:', error);
    }
  }

  /**
   * Deploy a new contract
   */
  async deployContract(
    contractName: string,
    abi: any[],
    bytecode: string,
    constructorArgs: any[] = []
  ): Promise<string> {
    try {
      const factory = new ethers.ContractFactory(abi, bytecode, this.wallet);
      const contract = await factory.deploy(...constructorArgs);
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      console.log(`${contractName} deployed at: ${address}`);
      
      // Register the deployed contract
      this.registerContract(contractName, { address, abi });
      
      return address;
    } catch (error) {
      console.error(`Error deploying ${contractName}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup - stop all event listeners
   */
  cleanup(): void {
    for (const [listenerKey, listener] of this.eventListeners) {
      const [contractName, eventName] = listenerKey.split('.');
      this.stopEventListener(contractName, eventName);
    }
    console.log('BlockchainService cleanup completed');
  }
}

// Create singleton instance
export const blockchainService = new BlockchainService();

// Initialize default contracts on startup
blockchainService.initializeDefaultContracts().catch(console.error);

export default BlockchainService;
