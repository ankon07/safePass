// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Anchor
 * @dev Simple contract for anchoring Merkle roots from private Besu chain to public chain
 * Designed to be extremely gas-efficient for batch anchoring operations
 */
contract Anchor is Ownable {
    // State variables
    uint256 public batchCounter;
    mapping(uint256 => bytes32) public anchoredRoots;

    // Events
    event BatchAnchored(uint256 indexed batchId, bytes32 indexed root, address sender);

    /**
     * @dev Constructor sets the contract deployer as the owner
     */
    constructor() Ownable(msg.sender) {
        batchCounter = 0;
    }

    /**
     * @dev Anchors a new Merkle root batch
     * @param _merkleRoot The Merkle root hash to anchor
     * Only callable by the contract owner (backend service)
     */
    function anchorNewBatch(bytes32 _merkleRoot) external onlyOwner {
        require(_merkleRoot != bytes32(0), "Merkle root cannot be zero");

        // Increment batch counter
        batchCounter++;

        // Store the Merkle root
        anchoredRoots[batchCounter] = _merkleRoot;

        // Emit event for off-chain monitoring
        emit BatchAnchored(batchCounter, _merkleRoot, msg.sender);
    }

    /**
     * @dev Returns the Merkle root for a specific batch ID
     * @param batchId The batch ID to query
     * @return The Merkle root hash for the specified batch
     */
    function getMerkleRoot(uint256 batchId) external view returns (bytes32) {
        require(batchId > 0 && batchId <= batchCounter, "Invalid batch ID");
        return anchoredRoots[batchId];
    }

    /**
     * @dev Returns the latest batch ID and its Merkle root
     * @return batchId The latest batch ID
     * @return merkleRoot The latest Merkle root
     */
    function getLatestBatch() external view returns (uint256 batchId, bytes32 merkleRoot) {
        require(batchCounter > 0, "No batches anchored yet");
        return (batchCounter, anchoredRoots[batchCounter]);
    }

    /**
     * @dev Checks if a specific batch ID exists
     * @param batchId The batch ID to check
     * @return True if the batch exists, false otherwise
     */
    function batchExists(uint256 batchId) external view returns (bool) {
        return batchId > 0 && batchId <= batchCounter && anchoredRoots[batchId] != bytes32(0);
    }
}
