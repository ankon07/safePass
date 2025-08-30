require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv/config");

// Private Blockchain (Hyperledger Besu)
const BESU_LOCAL_URL = "http://127.0.0.1:8545";
const BESU_LOCAL_PRIVATE_KEY = process.env.BESU_LOCAL_PRIVATE_KEY || "";

// Public Blockchain Networks
const ETHEREUM_MAINNET_URL = process.env.ETHEREUM_MAINNET_URL || "";
const ETHEREUM_SEPOLIA_URL = process.env.ETHEREUM_SEPOLIA_URL || "";
const POLYGON_MAINNET_URL = process.env.POLYGON_MAINNET_URL || "";
const POLYGON_MUMBAI_URL = process.env.POLYGON_MUMBAI_URL || "";
const BSC_MAINNET_URL = process.env.BSC_MAINNET_URL || "";
const BSC_TESTNET_URL = process.env.BSC_TESTNET_URL || "";

// Private keys for different networks
const PUBLIC_NETWORK_PRIVATE_KEY = process.env.PUBLIC_NETWORK_PRIVATE_KEY || "";
const TESTNET_PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY || "";

// Validation
if (BESU_LOCAL_PRIVATE_KEY === "") {
  console.warn("Please set your BESU_LOCAL_PRIVATE_KEY in a .env file");
}

if (PUBLIC_NETWORK_PRIVATE_KEY === "") {
  console.warn("Please set your PUBLIC_NETWORK_PRIVATE_KEY in a .env file for public network deployments");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Private Blockchain (Hyperledger Besu)
    besu_local: {
      url: BESU_LOCAL_URL,
      accounts: BESU_LOCAL_PRIVATE_KEY ? [BESU_LOCAL_PRIVATE_KEY] : [],
      chainId: 1337,
      gasPrice: 1000,
      gas: 8000000,
    },
    
    // Ethereum Networks
    ethereum_mainnet: {
      url: ETHEREUM_MAINNET_URL,
      accounts: PUBLIC_NETWORK_PRIVATE_KEY ? [PUBLIC_NETWORK_PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: "auto",
    },
    ethereum_sepolia: {
      url: ETHEREUM_SEPOLIA_URL,
      accounts: TESTNET_PRIVATE_KEY ? [TESTNET_PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto",
    },
    
    // Polygon Networks
    polygon_mainnet: {
      url: POLYGON_MAINNET_URL,
      accounts: PUBLIC_NETWORK_PRIVATE_KEY ? [PUBLIC_NETWORK_PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: "auto",
    },
    polygon_mumbai: {
      url: POLYGON_MUMBAI_URL,
      accounts: TESTNET_PRIVATE_KEY ? [TESTNET_PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: "auto",
    },
    
    // Binance Smart Chain Networks
    bsc_mainnet: {
      url: BSC_MAINNET_URL,
      accounts: PUBLIC_NETWORK_PRIVATE_KEY ? [PUBLIC_NETWORK_PRIVATE_KEY] : [],
      chainId: 56,
      gasPrice: "auto",
    },
    bsc_testnet: {
      url: BSC_TESTNET_URL,
      accounts: TESTNET_PRIVATE_KEY ? [TESTNET_PRIVATE_KEY] : [],
      chainId: 97,
      gasPrice: "auto",
    },
    
    // Local development networks
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
  },
  
  // Gas reporting
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  
  // Etherscan verification
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || "",
    },
  },
};
