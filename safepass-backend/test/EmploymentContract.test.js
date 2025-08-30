"use strict";
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
describe("EmploymentContract", function () {
    let employmentContract;
    let worker;
    let employer;
    let regulator;
    let randomUser;
    const salary = ethers.parseEther("1000"); // 1000 ETH equivalent
    const termsHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG"; // Example IPFS hash
    beforeEach(async function () {
        // Get signers
        [worker, employer, regulator, randomUser] = await ethers.getSigners();
        // Deploy contract
        const EmploymentContractFactory = await ethers.getContractFactory("EmploymentContract");
        employmentContract = await EmploymentContractFactory.deploy(worker.address, employer.address, salary, termsHash, regulator.address);
        await employmentContract.waitForDeployment();
    });
    describe("Deployment", function () {
        it("Should set the correct initial values", async function () {
            expect(await employmentContract.worker()).to.equal(worker.address);
            expect(await employmentContract.employer()).to.equal(employer.address);
            expect(await employmentContract.salary()).to.equal(salary);
            expect(await employmentContract.termsHash()).to.equal(termsHash);
            expect(await employmentContract.regulator()).to.equal(regulator.address);
            expect(await employmentContract.status()).to.equal(0); // Proposed
            expect(await employmentContract.workerSigned()).to.equal(false);
            expect(await employmentContract.employerSigned()).to.equal(false);
        });
        it("Should revert with zero addresses", async function () {
            const EmploymentContractFactory = await ethers.getContractFactory("EmploymentContract");
            await expect(EmploymentContractFactory.deploy(ethers.ZeroAddress, employer.address, salary, termsHash, regulator.address)).to.be.revertedWith("Worker address cannot be zero");
            await expect(EmploymentContractFactory.deploy(worker.address, ethers.ZeroAddress, salary, termsHash, regulator.address)).to.be.revertedWith("Employer address cannot be zero");
            await expect(EmploymentContractFactory.deploy(worker.address, employer.address, salary, termsHash, ethers.ZeroAddress)).to.be.revertedWith("Regulator address cannot be zero");
        });
        it("Should revert when worker and employer are the same", async function () {
            const EmploymentContractFactory = await ethers.getContractFactory("EmploymentContract");
            await expect(EmploymentContractFactory.deploy(worker.address, worker.address, salary, termsHash, regulator.address)).to.be.revertedWith("Worker and employer must be different");
        });
        it("Should revert with zero salary", async function () {
            const EmploymentContractFactory = await ethers.getContractFactory("EmploymentContract");
            await expect(EmploymentContractFactory.deploy(worker.address, employer.address, 0, termsHash, regulator.address)).to.be.revertedWith("Salary must be greater than zero");
        });
        it("Should revert with empty terms hash", async function () {
            const EmploymentContractFactory = await ethers.getContractFactory("EmploymentContract");
            await expect(EmploymentContractFactory.deploy(worker.address, employer.address, salary, "", regulator.address)).to.be.revertedWith("Terms hash cannot be empty");
        });
    });
    describe("Contract Signing", function () {
        it("Should allow worker to sign the contract", async function () {
            await employmentContract.connect(worker).signContract();
            expect(await employmentContract.workerSigned()).to.equal(true);
            expect(await employmentContract.employerSigned()).to.equal(false);
            expect(await employmentContract.status()).to.equal(0); // Still Proposed
        });
        it("Should allow employer to sign the contract", async function () {
            await employmentContract.connect(employer).signContract();
            expect(await employmentContract.workerSigned()).to.equal(false);
            expect(await employmentContract.employerSigned()).to.equal(true);
            expect(await employmentContract.status()).to.equal(0); // Still Proposed
        });
        it("Should activate contract when both parties sign", async function () {
            // Worker signs first
            await employmentContract.connect(worker).signContract();
            // Employer signs second
            await expect(employmentContract.connect(employer).signContract())
                .to.emit(employmentContract, "ContractSigned")
                .withArgs(worker.address, employer.address)
                .and.to.emit(employmentContract, "StatusChanged")
                .withArgs(1); // Active
            expect(await employmentContract.workerSigned()).to.equal(true);
            expect(await employmentContract.employerSigned()).to.equal(true);
            expect(await employmentContract.status()).to.equal(1); // Active
        });
        it("Should activate contract regardless of signing order", async function () {
            // Employer signs first
            await employmentContract.connect(employer).signContract();
            // Worker signs second
            await expect(employmentContract.connect(worker).signContract())
                .to.emit(employmentContract, "ContractSigned")
                .withArgs(worker.address, employer.address);
            expect(await employmentContract.status()).to.equal(1); // Active
        });
        it("Should prevent non-parties from signing", async function () {
            await expect(employmentContract.connect(randomUser).signContract()).to.be.revertedWith("Only contract parties can call this function");
        });
        it("Should prevent double signing by the same party", async function () {
            await employmentContract.connect(worker).signContract();
            await expect(employmentContract.connect(worker).signContract()).to.be.revertedWith("Worker has already signed");
        });
        it("Should prevent signing when not in Proposed status", async function () {
            // Sign both parties to activate
            await employmentContract.connect(worker).signContract();
            await employmentContract.connect(employer).signContract();
            // Try to sign again when Active
            await expect(employmentContract.connect(worker).signContract()).to.be.revertedWith("Contract must be in proposed state");
        });
    });
    describe("Payment Recording", function () {
        beforeEach(async function () {
            // Activate contract
            await employmentContract.connect(worker).signContract();
            await employmentContract.connect(employer).signContract();
        });
        it("Should allow employer to record payments", async function () {
            const paymentAmount = ethers.parseEther("500");
            const tx = await employmentContract.connect(employer).recordPayment(paymentAmount);
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt.blockNumber);
            await expect(tx)
                .to.emit(employmentContract, "PaymentRecorded")
                .withArgs(paymentAmount, block.timestamp);
            expect(await employmentContract.getPaymentCount()).to.equal(1);
            const [amount, timestamp] = await employmentContract.getPayment(0);
            expect(amount).to.equal(paymentAmount);
            expect(timestamp).to.equal(block.timestamp);
        });
        it("Should prevent non-employer from recording payments", async function () {
            const paymentAmount = ethers.parseEther("500");
            await expect(employmentContract.connect(worker).recordPayment(paymentAmount)).to.be.revertedWith("Only employer can call this function");
            await expect(employmentContract.connect(randomUser).recordPayment(paymentAmount)).to.be.revertedWith("Only employer can call this function");
        });
        it("Should prevent recording zero payments", async function () {
            await expect(employmentContract.connect(employer).recordPayment(0)).to.be.revertedWith("Payment amount must be greater than zero");
        });
        it("Should prevent recording payments when not active", async function () {
            // Deploy new contract (Proposed state)
            const EmploymentContractFactory = await ethers.getContractFactory("EmploymentContract");
            const newContract = await EmploymentContractFactory.deploy(worker.address, employer.address, salary, termsHash, regulator.address);
            const paymentAmount = ethers.parseEther("500");
            await expect(newContract.connect(employer).recordPayment(paymentAmount)).to.be.revertedWith("Contract must be active");
        });
        it("Should track multiple payments correctly", async function () {
            const payment1 = ethers.parseEther("500");
            const payment2 = ethers.parseEther("750");
            await employmentContract.connect(employer).recordPayment(payment1);
            await employmentContract.connect(employer).recordPayment(payment2);
            expect(await employmentContract.getPaymentCount()).to.equal(2);
            const [amounts, timestamps] = await employmentContract.getAllPayments();
            expect(amounts[0]).to.equal(payment1);
            expect(amounts[1]).to.equal(payment2);
            expect(timestamps[0]).to.be.greaterThan(0);
            expect(timestamps[1]).to.be.greaterThan(timestamps[0]);
        });
    });
    describe("Dispute Management", function () {
        beforeEach(async function () {
            // Activate contract
            await employmentContract.connect(worker).signContract();
            await employmentContract.connect(employer).signContract();
        });
        it("Should allow worker to raise a dispute", async function () {
            await expect(employmentContract.connect(worker).raiseDispute())
                .to.emit(employmentContract, "DisputeRaised")
                .withArgs(worker.address)
                .and.to.emit(employmentContract, "StatusChanged")
                .withArgs(2); // Disputed
            expect(await employmentContract.status()).to.equal(2); // Disputed
        });
        it("Should prevent employer from raising disputes", async function () {
            await expect(employmentContract.connect(employer).raiseDispute()).to.be.revertedWith("Only worker can call this function");
        });
        it("Should prevent non-parties from raising disputes", async function () {
            await expect(employmentContract.connect(randomUser).raiseDispute()).to.be.revertedWith("Only worker can call this function");
        });
        it("Should prevent raising disputes when not active", async function () {
            // Deploy new contract (Proposed state)
            const EmploymentContractFactory = await ethers.getContractFactory("EmploymentContract");
            const newContract = await EmploymentContractFactory.deploy(worker.address, employer.address, salary, termsHash, regulator.address);
            await expect(newContract.connect(worker).raiseDispute()).to.be.revertedWith("Contract must be active");
        });
        it("Should allow regulator to resolve disputes to Active", async function () {
            // Raise dispute first
            await employmentContract.connect(worker).raiseDispute();
            await expect(employmentContract.connect(regulator).resolveDispute(1)) // Active
                .to.emit(employmentContract, "StatusChanged")
                .withArgs(1);
            expect(await employmentContract.status()).to.equal(1); // Active
        });
        it("Should allow regulator to resolve disputes to Completed", async function () {
            // Raise dispute first
            await employmentContract.connect(worker).raiseDispute();
            await expect(employmentContract.connect(regulator).resolveDispute(3)) // Completed
                .to.emit(employmentContract, "StatusChanged")
                .withArgs(3);
            expect(await employmentContract.status()).to.equal(3); // Completed
        });
        it("Should prevent non-regulator from resolving disputes", async function () {
            // Raise dispute first
            await employmentContract.connect(worker).raiseDispute();
            await expect(employmentContract.connect(worker).resolveDispute(1)).to.be.revertedWith("Only regulator can call this function");
            await expect(employmentContract.connect(employer).resolveDispute(1)).to.be.revertedWith("Only regulator can call this function");
            await expect(employmentContract.connect(randomUser).resolveDispute(1)).to.be.revertedWith("Only regulator can call this function");
        });
        it("Should prevent resolving when no dispute exists", async function () {
            await expect(employmentContract.connect(regulator).resolveDispute(1)).to.be.revertedWith("No active dispute to resolve");
        });
        it("Should prevent invalid resolution statuses", async function () {
            // Raise dispute first
            await employmentContract.connect(worker).raiseDispute();
            await expect(employmentContract.connect(regulator).resolveDispute(0) // Proposed
            ).to.be.revertedWith("Invalid resolution status");
            await expect(employmentContract.connect(regulator).resolveDispute(2) // Disputed
            ).to.be.revertedWith("Invalid resolution status");
        });
    });
    describe("Contract Completion", function () {
        beforeEach(async function () {
            // Activate contract
            await employmentContract.connect(worker).signContract();
            await employmentContract.connect(employer).signContract();
        });
        it("Should allow worker to complete the contract", async function () {
            await expect(employmentContract.connect(worker).completeContract())
                .to.emit(employmentContract, "StatusChanged")
                .withArgs(3); // Completed
            expect(await employmentContract.status()).to.equal(3); // Completed
        });
        it("Should allow employer to complete the contract", async function () {
            await expect(employmentContract.connect(employer).completeContract())
                .to.emit(employmentContract, "StatusChanged")
                .withArgs(3); // Completed
            expect(await employmentContract.status()).to.equal(3); // Completed
        });
        it("Should allow completion from disputed state", async function () {
            // Raise dispute first
            await employmentContract.connect(worker).raiseDispute();
            // Complete from disputed state
            await expect(employmentContract.connect(employer).completeContract())
                .to.emit(employmentContract, "StatusChanged")
                .withArgs(3); // Completed
            expect(await employmentContract.status()).to.equal(3); // Completed
        });
        it("Should prevent non-parties from completing", async function () {
            await expect(employmentContract.connect(randomUser).completeContract()).to.be.revertedWith("Only contract parties can call this function");
        });
        it("Should prevent completion from Proposed state", async function () {
            // Deploy new contract (Proposed state)
            const EmploymentContractFactory = await ethers.getContractFactory("EmploymentContract");
            const newContract = await EmploymentContractFactory.deploy(worker.address, employer.address, salary, termsHash, regulator.address);
            await expect(newContract.connect(worker).completeContract()).to.be.revertedWith("Contract must be active or disputed to complete");
        });
    });
    describe("Payment Queries", function () {
        beforeEach(async function () {
            // Activate contract and add some payments
            await employmentContract.connect(worker).signContract();
            await employmentContract.connect(employer).signContract();
            await employmentContract.connect(employer).recordPayment(ethers.parseEther("500"));
            await employmentContract.connect(employer).recordPayment(ethers.parseEther("750"));
        });
        it("Should return correct payment count", async function () {
            expect(await employmentContract.getPaymentCount()).to.equal(2);
        });
        it("Should return payment details by index", async function () {
            const [amount, timestamp] = await employmentContract.getPayment(0);
            expect(amount).to.equal(ethers.parseEther("500"));
            expect(timestamp).to.be.greaterThan(0);
        });
        it("Should revert for invalid payment index", async function () {
            await expect(employmentContract.getPayment(5)).to.be.revertedWith("Payment index out of bounds");
        });
        it("Should return all payments correctly", async function () {
            const [amounts, timestamps] = await employmentContract.getAllPayments();
            expect(amounts.length).to.equal(2);
            expect(timestamps.length).to.equal(2);
            expect(amounts[0]).to.equal(ethers.parseEther("500"));
            expect(amounts[1]).to.equal(ethers.parseEther("750"));
        });
    });
});
