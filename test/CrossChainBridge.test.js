const { expect } = require("chai");
const hre = require("hardhat");

describe("Cross-Chain Bridge Functionality", function () {
  let anchor;
  let employmentContract;
  let owner;
  let worker;
  let employer;
  let regulator;

  beforeEach(async function () {
    // Get signers
    [owner, worker, employer, regulator] = await hre.ethers.getSigners();

    // Deploy Anchor contract
    const AnchorFactory = await hre.ethers.getContractFactory("Anchor");
    anchor = await AnchorFactory.deploy();
    await anchor.waitForDeployment();

    // Deploy EmploymentContract
    const EmploymentContractFactory = await hre.ethers.getContractFactory("EmploymentContract");
    const salary = hre.ethers.parseEther("1000");
    const termsHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";

    employmentContract = await EmploymentContractFactory.deploy(
      worker.address,
      employer.address,
      salary,
      termsHash,
      regulator.address
    );
    await employmentContract.waitForDeployment();
  });

  describe("Cross-Chain Anchoring", function () {
    it("Should anchor employment contract data to public chain", async function () {
      // Simulate creating a Merkle root from employment contract data
      const contractData = {
        worker: await employmentContract.worker(),
        employer: await employmentContract.employer(),
        salary: (await employmentContract.salary()).toString(),
        termsHash: await employmentContract.termsHash(),
        status: await employmentContract.status()
      };

      // Create a simple hash of the contract data (in production, use proper Merkle tree)
      const dataString = JSON.stringify(contractData);
      const merkleRoot = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(dataString));

      // Anchor the data
      await expect(anchor.anchorNewBatch(merkleRoot))
        .to.emit(anchor, "BatchAnchored")
        .withArgs(1, merkleRoot, owner.address);

      // Verify the anchored data
      const storedRoot = await anchor.getMerkleRoot(1);
      expect(storedRoot).to.equal(merkleRoot);

      const batchExists = await anchor.batchExists(1);
      expect(batchExists).to.be.true;
    });

    it("Should handle multiple contract anchoring in batches", async function () {
      const contractAddresses = [
        await employmentContract.getAddress(),
        "0x1234567890123456789012345678901234567890",
        "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      ];

      // Create Merkle roots for each batch
      const merkleRoots = contractAddresses.map(addr => 
        hre.ethers.keccak256(hre.ethers.toUtf8Bytes(addr))
      );

      // Anchor each batch
      for (let i = 0; i < merkleRoots.length; i++) {
        await anchor.anchorNewBatch(merkleRoots[i]);
        
        const storedRoot = await anchor.getMerkleRoot(i + 1);
        expect(storedRoot).to.equal(merkleRoots[i]);
      }

      // Verify batch counter
      const batchCounter = await anchor.batchCounter();
      expect(batchCounter).to.equal(contractAddresses.length);
    });

    it("Should verify cross-chain data integrity", async function () {
      // Sign the employment contract
      await employmentContract.connect(worker).signContract();
      await employmentContract.connect(employer).signContract();

      // Record a payment
      const paymentAmount = hre.ethers.parseEther("500");
      await employmentContract.connect(employer).recordPayment(paymentAmount);

      // Get contract state
      const contractState = {
        worker: await employmentContract.worker(),
        employer: await employmentContract.employer(),
        status: await employmentContract.status(),
        workerSigned: await employmentContract.workerSigned(),
        employerSigned: await employmentContract.employerSigned(),
        paymentCount: (await employmentContract.getPaymentCount()).toString()
      };

      // Create hash of the state
      const stateHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify(contractState)));

      // Anchor the state
      await anchor.anchorNewBatch(stateHash);

      // Verify the anchored state
      const storedHash = await anchor.getMerkleRoot(1);
      expect(storedHash).to.equal(stateHash);

      // Simulate verification on public chain
      const retrievedState = await anchor.getMerkleRoot(1);
      expect(retrievedState).to.equal(stateHash);
    });
  });

  describe("Employment Contract Lifecycle with Anchoring", function () {
    it("Should anchor contract state changes", async function () {
      const states = [];

      // Initial state
      let currentState = {
        status: (await employmentContract.status()).toString(),
        workerSigned: await employmentContract.workerSigned(),
        employerSigned: await employmentContract.employerSigned()
      };
      states.push(currentState);

      // Worker signs
      await employmentContract.connect(worker).signContract();
      currentState = {
        status: (await employmentContract.status()).toString(),
        workerSigned: await employmentContract.workerSigned(),
        employerSigned: await employmentContract.employerSigned()
      };
      states.push(currentState);

      // Employer signs (contract becomes active)
      await employmentContract.connect(employer).signContract();
      currentState = {
        status: (await employmentContract.status()).toString(),
        workerSigned: await employmentContract.workerSigned(),
        employerSigned: await employmentContract.employerSigned()
      };
      states.push(currentState);

      // Anchor each state change
      for (let i = 0; i < states.length; i++) {
        const stateHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify(states[i])));
        await anchor.anchorNewBatch(stateHash);
        
        const storedHash = await anchor.getMerkleRoot(i + 1);
        expect(storedHash).to.equal(stateHash);
      }

      expect(await anchor.batchCounter()).to.equal(states.length);
    });

    it("Should handle dispute resolution with anchoring", async function () {
      // Activate contract
      await employmentContract.connect(worker).signContract();
      await employmentContract.connect(employer).signContract();

      // Record payments
      await employmentContract.connect(employer).recordPayment(hre.ethers.parseEther("500"));
      await employmentContract.connect(employer).recordPayment(hre.ethers.parseEther("300"));

      // Worker raises dispute
      await employmentContract.connect(worker).raiseDispute();

      // Anchor dispute state
      const disputeState = {
        status: (await employmentContract.status()).toString(), // Should be 2 (Disputed)
        paymentCount: (await employmentContract.getPaymentCount()).toString()
      };
      const disputeHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify(disputeState)));
      await anchor.anchorNewBatch(disputeHash);

      // Regulator resolves dispute
      await employmentContract.connect(regulator).resolveDispute(1); // 1 = Active

      // Anchor resolution state
      const resolutionState = {
        status: (await employmentContract.status()).toString(), // Should be 1 (Active)
        paymentCount: (await employmentContract.getPaymentCount()).toString()
      };
      const resolutionHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify(resolutionState)));
      await anchor.anchorNewBatch(resolutionHash);

      // Verify both states are anchored
      expect(await anchor.getMerkleRoot(1)).to.equal(disputeHash);
      expect(await anchor.getMerkleRoot(2)).to.equal(resolutionHash);
      expect(await anchor.batchCounter()).to.equal(2);
    });
  });

  describe("Cross-Chain Verification", function () {
    it("Should verify employment contract exists on private chain", async function () {
      const contractAddress = await employmentContract.getAddress();
      
      // Create proof of existence
      const existenceProof = {
        contractAddress: contractAddress,
        worker: await employmentContract.worker(),
        employer: await employmentContract.employer(),
        blockNumber: (await hre.ethers.provider.getBlockNumber()).toString(),
        timestamp: Math.floor(Date.now() / 1000).toString()
      };

      const proofHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(JSON.stringify(existenceProof)));
      
      // Anchor the proof
      await anchor.anchorNewBatch(proofHash);
      
      // Verify proof is anchored
      const storedProof = await anchor.getMerkleRoot(1);
      expect(storedProof).to.equal(proofHash);
      
      // Simulate public chain verification
      const isVerified = await anchor.batchExists(1);
      expect(isVerified).to.be.true;
    });

    it("Should handle batch verification for multiple contracts", async function () {
      // Simulate multiple employment contracts
      const contractProofs = [];
      
      for (let i = 0; i < 5; i++) {
        const proof = {
          contractId: i.toString(),
          worker: `0x${i.toString().padStart(40, '0')}`,
          employer: `0x${(i + 1).toString().padStart(40, '0')}`,
          salary: hre.ethers.parseEther((1000 + i * 100).toString()).toString(),
          timestamp: (Math.floor(Date.now() / 1000) + i).toString()
        };
        contractProofs.push(proof);
      }

      // Create batch Merkle root
      const batchData = JSON.stringify(contractProofs);
      const batchRoot = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(batchData));

      // Anchor the batch
      await anchor.anchorNewBatch(batchRoot);

      // Verify batch
      const storedBatch = await anchor.getMerkleRoot(1);
      expect(storedBatch).to.equal(batchRoot);

      // Get latest batch info
      const [latestBatchId, latestRoot] = await anchor.getLatestBatch();
      expect(latestBatchId).to.equal(1);
      expect(latestRoot).to.equal(batchRoot);
    });
  });

  describe("Gas Optimization for Cross-Chain Operations", function () {
    it("Should be gas efficient for batch anchoring", async function () {
      const merkleRoot = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      
      const tx = await anchor.anchorNewBatch(merkleRoot);
      const receipt = await tx.wait();
      
      // Gas usage should be reasonable for anchoring operations
      expect(receipt.gasUsed).to.be.lessThan(100000);
      
      console.log(`Gas used for anchoring: ${receipt.gasUsed.toString()}`);
    });

    it("Should handle multiple anchoring operations efficiently", async function () {
      const gasUsages = [];
      
      for (let i = 0; i < 10; i++) {
        const merkleRoot = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`batch-${i}`));
        const tx = await anchor.anchorNewBatch(merkleRoot);
        const receipt = await tx.wait();
        gasUsages.push(receipt.gasUsed);
      }

      // Calculate average gas usage
      const avgGas = gasUsages.reduce((a, b) => a + b, 0n) / BigInt(gasUsages.length);
      console.log(`Average gas per anchor: ${avgGas.toString()}`);

      // Gas usage should be consistent
      for (const gasUsed of gasUsages) {
        const variance = gasUsed > avgGas ? gasUsed - avgGas : avgGas - gasUsed;
        const percentVariance = (variance * 100n) / avgGas;
        expect(percentVariance).to.be.lessThan(10); // Less than 10% variance
      }
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("Should handle invalid Merkle roots", async function () {
      const zeroRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";
      
      await expect(
        anchor.anchorNewBatch(zeroRoot)
      ).to.be.revertedWith("Merkle root cannot be zero");
    });

    it("Should handle non-existent batch queries", async function () {
      await expect(
        anchor.getMerkleRoot(999)
      ).to.be.revertedWith("Invalid batch ID");

      expect(await anchor.batchExists(999)).to.be.false;
    });

    it("Should handle employment contract edge cases", async function () {
      // Try to sign twice
      await employmentContract.connect(worker).signContract();
      
      await expect(
        employmentContract.connect(worker).signContract()
      ).to.be.revertedWith("Worker has already signed");

      // Try to raise dispute before contract is active
      await expect(
        employmentContract.connect(worker).raiseDispute()
      ).to.be.revertedWith("Contract must be active");
    });
  });
});
