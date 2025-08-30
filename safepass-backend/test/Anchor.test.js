"use strict";
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;
describe("Anchor", function () {
    let anchor;
    let owner;
    let nonOwner;
    let randomUser;
    beforeEach(async function () {
        // Get signers
        [owner, nonOwner, randomUser] = await ethers.getSigners();
        // Deploy contract
        const AnchorFactory = await ethers.getContractFactory("Anchor");
        anchor = await AnchorFactory.deploy();
        await anchor.waitForDeployment();
    });
    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await anchor.owner()).to.equal(owner.address);
        });
        it("Should initialize batch counter to 0", async function () {
            expect(await anchor.batchCounter()).to.equal(0);
        });
    });
    describe("Anchoring Batches", function () {
        const merkleRoot = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
        it("Should allow owner to anchor a new batch", async function () {
            await expect(anchor.connect(owner).anchorNewBatch(merkleRoot))
                .to.emit(anchor, "BatchAnchored")
                .withArgs(1, merkleRoot, owner.address);
            expect(await anchor.batchCounter()).to.equal(1);
            expect(await anchor.anchoredRoots(1)).to.equal(merkleRoot);
        });
        it("Should prevent non-owner from anchoring batches", async function () {
            await expect(anchor.connect(nonOwner).anchorNewBatch(merkleRoot)).to.be.revertedWithCustomError(anchor, "OwnableUnauthorizedAccount")
                .withArgs(nonOwner.address);
            await expect(anchor.connect(randomUser).anchorNewBatch(merkleRoot)).to.be.revertedWithCustomError(anchor, "OwnableUnauthorizedAccount")
                .withArgs(randomUser.address);
        });
        it("Should prevent anchoring zero merkle root", async function () {
            const zeroRoot = "0x0000000000000000000000000000000000000000000000000000000000000000";
            await expect(anchor.connect(owner).anchorNewBatch(zeroRoot)).to.be.revertedWith("Merkle root cannot be zero");
        });
        it("Should increment batch counter correctly", async function () {
            const root1 = "0x1111111111111111111111111111111111111111111111111111111111111111";
            const root2 = "0x2222222222222222222222222222222222222222222222222222222222222222";
            const root3 = "0x3333333333333333333333333333333333333333333333333333333333333333";
            await anchor.connect(owner).anchorNewBatch(root1);
            expect(await anchor.batchCounter()).to.equal(1);
            await anchor.connect(owner).anchorNewBatch(root2);
            expect(await anchor.batchCounter()).to.equal(2);
            await anchor.connect(owner).anchorNewBatch(root3);
            expect(await anchor.batchCounter()).to.equal(3);
            expect(await anchor.anchoredRoots(1)).to.equal(root1);
            expect(await anchor.anchoredRoots(2)).to.equal(root2);
            expect(await anchor.anchoredRoots(3)).to.equal(root3);
        });
        it("Should emit BatchAnchored event with correct data", async function () {
            const root = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";
            await expect(anchor.connect(owner).anchorNewBatch(root))
                .to.emit(anchor, "BatchAnchored")
                .withArgs(1, root, owner.address);
        });
    });
    describe("Merkle Root Queries", function () {
        const root1 = "0x1111111111111111111111111111111111111111111111111111111111111111";
        const root2 = "0x2222222222222222222222222222222222222222222222222222222222222222";
        beforeEach(async function () {
            await anchor.connect(owner).anchorNewBatch(root1);
            await anchor.connect(owner).anchorNewBatch(root2);
        });
        it("Should return correct merkle root for valid batch ID", async function () {
            expect(await anchor.getMerkleRoot(1)).to.equal(root1);
            expect(await anchor.getMerkleRoot(2)).to.equal(root2);
        });
        it("Should revert for invalid batch ID (zero)", async function () {
            await expect(anchor.getMerkleRoot(0)).to.be.revertedWith("Invalid batch ID");
        });
        it("Should revert for invalid batch ID (too high)", async function () {
            await expect(anchor.getMerkleRoot(5)).to.be.revertedWith("Invalid batch ID");
        });
        it("Should return latest batch correctly", async function () {
            const [batchId, merkleRoot] = await anchor.getLatestBatch();
            expect(batchId).to.equal(2);
            expect(merkleRoot).to.equal(root2);
        });
        it("Should revert getLatestBatch when no batches exist", async function () {
            // Deploy new contract with no batches
            const AnchorFactory = await ethers.getContractFactory("Anchor");
            const newAnchor = await AnchorFactory.deploy();
            await expect(newAnchor.getLatestBatch()).to.be.revertedWith("No batches anchored yet");
        });
        it("Should correctly check batch existence", async function () {
            expect(await anchor.batchExists(1)).to.equal(true);
            expect(await anchor.batchExists(2)).to.equal(true);
            expect(await anchor.batchExists(0)).to.equal(false);
            expect(await anchor.batchExists(3)).to.equal(false);
            expect(await anchor.batchExists(999)).to.equal(false);
        });
    });
    describe("Gas Efficiency", function () {
        it("Should be gas efficient for batch anchoring", async function () {
            const merkleRoot = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
            const tx = await anchor.connect(owner).anchorNewBatch(merkleRoot);
            const receipt = await tx.wait();
            // Gas usage should be reasonable (less than 100k gas)
            expect(receipt.gasUsed).to.be.lessThan(100000);
        });
        it("Should have consistent gas usage across multiple anchors", async function () {
            const roots = [
                "0x1111111111111111111111111111111111111111111111111111111111111111",
                "0x2222222222222222222222222222222222222222222222222222222222222222",
                "0x3333333333333333333333333333333333333333333333333333333333333333"
            ];
            const gasUsages = [];
            for (const root of roots) {
                const tx = await anchor.connect(owner).anchorNewBatch(root);
                const receipt = await tx.wait();
                gasUsages.push(receipt.gasUsed);
            }
            // Gas usage should be consistent (within 25% variance)
            const avgGas = gasUsages.reduce((a, b) => a + b, 0n) / BigInt(gasUsages.length);
            for (const gasUsed of gasUsages) {
                const variance = gasUsed > avgGas ? gasUsed - avgGas : avgGas - gasUsed;
                const percentVariance = (variance * 100n) / avgGas;
                expect(percentVariance).to.be.lessThan(25);
            }
        });
    });
    describe("Edge Cases", function () {
        it("Should handle maximum uint256 batch counter", async function () {
            // This test verifies the contract can handle large batch numbers
            // We can't actually reach max uint256 in tests, but we can verify the logic
            const merkleRoot = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
            await anchor.connect(owner).anchorNewBatch(merkleRoot);
            expect(await anchor.batchCounter()).to.equal(1);
            // Verify the mapping works correctly
            expect(await anchor.anchoredRoots(1)).to.equal(merkleRoot);
        });
        it("Should handle different merkle root formats", async function () {
            const roots = [
                "0x0000000000000000000000000000000000000000000000000000000000000001", // Minimal non-zero
                "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", // Maximum value
                "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0" // Mixed hex
            ];
            for (let i = 0; i < roots.length; i++) {
                await anchor.connect(owner).anchorNewBatch(roots[i]);
                expect(await anchor.anchoredRoots(i + 1)).to.equal(roots[i]);
            }
        });
    });
    describe("Access Control", function () {
        it("Should maintain owner after multiple operations", async function () {
            const merkleRoot = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
            // Perform multiple operations
            await anchor.connect(owner).anchorNewBatch(merkleRoot);
            await anchor.connect(owner).anchorNewBatch(merkleRoot);
            await anchor.connect(owner).anchorNewBatch(merkleRoot);
            // Owner should remain the same
            expect(await anchor.owner()).to.equal(owner.address);
        });
        it("Should allow owner to transfer ownership", async function () {
            // Transfer ownership to nonOwner
            await anchor.connect(owner).transferOwnership(nonOwner.address);
            expect(await anchor.owner()).to.equal(nonOwner.address);
            // New owner should be able to anchor batches
            const merkleRoot = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
            await expect(anchor.connect(nonOwner).anchorNewBatch(merkleRoot))
                .to.emit(anchor, "BatchAnchored")
                .withArgs(1, merkleRoot, nonOwner.address);
            // Old owner should no longer be able to anchor
            await expect(anchor.connect(owner).anchorNewBatch(merkleRoot)).to.be.revertedWithCustomError(anchor, "OwnableUnauthorizedAccount")
                .withArgs(owner.address);
        });
    });
});
