// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EmploymentContract
 * @dev Represents a legally-binding employment agreement between a worker and employer
 * Acts as digital escrow for trust and immutable log of agreement lifecycle
 */
contract EmploymentContract {
    // Contract status enumeration
    enum ContractStatus {
        Proposed,
        Active,
        Disputed,
        Completed
    }

    // State variables
    address public worker;
    address public employer;
    uint256 public salary;
    string public termsHash; // IPFS Content ID (CID)
    ContractStatus public status;
    bool public workerSigned;
    bool public employerSigned;
    address public regulator; // Trusted third party for dispute resolution

    // Payment tracking
    struct Payment {
        uint256 amount;
        uint256 timestamp;
    }
    Payment[] public payments;

    // Credential status tracking
    mapping(string => string) public credentialStatuses;
    mapping(string => address) public credentialIssuers;

    // Events
    event ContractSigned(address indexed worker, address indexed employer);
    event StatusChanged(ContractStatus newStatus);
    event PaymentRecorded(uint256 amount, uint256 timestamp);
    event DisputeRaised(address indexed worker);
    event CredentialStatusUpdated(string indexed credentialId, string status, address indexed updatedBy);

    // Modifiers
    modifier onlyWorker() {
        require(msg.sender == worker, "Only worker can call this function");
        _;
    }

    modifier onlyEmployer() {
        require(msg.sender == employer, "Only employer can call this function");
        _;
    }

    modifier onlyParties() {
        require(
            msg.sender == worker || msg.sender == employer,
            "Only contract parties can call this function"
        );
        _;
    }

    modifier onlyRegulator() {
        require(msg.sender == regulator, "Only regulator can call this function");
        _;
    }

    modifier onlyWhenActive() {
        require(status == ContractStatus.Active, "Contract must be active");
        _;
    }

    modifier onlyWhenProposed() {
        require(status == ContractStatus.Proposed, "Contract must be in proposed state");
        _;
    }

    /**
     * @dev Constructor initializes the contract with basic parameters
     * @param _worker Address of the migrant worker
     * @param _employer Address of the employer/agency
     * @param _salary Agreed-upon salary per pay period
     * @param _termsHash IPFS CID hash pointing to full contract document
     * @param _regulator Address of trusted third party for dispute resolution
     */
    constructor(
        address _worker,
        address _employer,
        uint256 _salary,
        string memory _termsHash,
        address _regulator
    ) {
        require(_worker != address(0), "Worker address cannot be zero");
        require(_employer != address(0), "Employer address cannot be zero");
        require(_regulator != address(0), "Regulator address cannot be zero");
        require(_worker != _employer, "Worker and employer must be different");
        require(_salary > 0, "Salary must be greater than zero");
        require(bytes(_termsHash).length > 0, "Terms hash cannot be empty");

        worker = _worker;
        employer = _employer;
        salary = _salary;
        termsHash = _termsHash;
        regulator = _regulator;
        status = ContractStatus.Proposed;
        workerSigned = false;
        employerSigned = false;
    }

    /**
     * @dev Allows worker or employer to sign the contract
     * Automatically activates contract when both parties have signed
     */
    function signContract() external onlyParties onlyWhenProposed {
        if (msg.sender == worker) {
            require(!workerSigned, "Worker has already signed");
            workerSigned = true;
        } else if (msg.sender == employer) {
            require(!employerSigned, "Employer has already signed");
            employerSigned = true;
        }

        // If both parties have signed, activate the contract
        if (workerSigned && employerSigned) {
            status = ContractStatus.Active;
            emit ContractSigned(worker, employer);
            emit StatusChanged(ContractStatus.Active);
        }
    }

    /**
     * @dev Allows employer to record a salary payment
     * @param amount The payment amount being recorded
     */
    function recordPayment(uint256 amount) external onlyEmployer onlyWhenActive {
        require(amount > 0, "Payment amount must be greater than zero");
        
        Payment memory newPayment = Payment({
            amount: amount,
            timestamp: block.timestamp
        });
        
        payments.push(newPayment);
        emit PaymentRecorded(amount, block.timestamp);
    }

    /**
     * @dev Allows worker to raise a dispute
     * Can only be called when contract is active
     */
    function raiseDispute() external onlyWorker onlyWhenActive {
        status = ContractStatus.Disputed;
        emit DisputeRaised(worker);
        emit StatusChanged(ContractStatus.Disputed);
    }

    /**
     * @dev Allows regulator to resolve a dispute
     * @param newStatus The new status to set (Active or Completed)
     */
    function resolveDispute(ContractStatus newStatus) external onlyRegulator {
        require(status == ContractStatus.Disputed, "No active dispute to resolve");
        require(
            newStatus == ContractStatus.Active || newStatus == ContractStatus.Completed,
            "Invalid resolution status"
        );

        status = newStatus;
        emit StatusChanged(newStatus);
    }

    /**
     * @dev Allows either party to mark the contract as completed
     */
    function completeContract() external onlyParties {
        require(
            status == ContractStatus.Active || status == ContractStatus.Disputed,
            "Contract must be active or disputed to complete"
        );

        status = ContractStatus.Completed;
        emit StatusChanged(ContractStatus.Completed);
    }

    /**
     * @dev Returns the total number of payments recorded
     */
    function getPaymentCount() external view returns (uint256) {
        return payments.length;
    }

    /**
     * @dev Returns payment details by index
     * @param index The index of the payment to retrieve
     */
    function getPayment(uint256 index) external view returns (uint256 amount, uint256 timestamp) {
        require(index < payments.length, "Payment index out of bounds");
        Payment memory payment = payments[index];
        return (payment.amount, payment.timestamp);
    }

    /**
     * @dev Returns all payment amounts and timestamps
     */
    function getAllPayments() external view returns (uint256[] memory amounts, uint256[] memory timestamps) {
        uint256 length = payments.length;
        amounts = new uint256[](length);
        timestamps = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            amounts[i] = payments[i].amount;
            timestamps[i] = payments[i].timestamp;
        }

        return (amounts, timestamps);
    }

    /**
     * @dev Updates the status of a credential
     * @param credentialId The unique identifier of the credential
     * @param newStatus The new status to set for the credential
     */
    function updateCredentialStatus(string memory credentialId, string memory newStatus) external onlyRegulator {
        require(bytes(credentialId).length > 0, "Credential ID cannot be empty");
        require(bytes(newStatus).length > 0, "Status cannot be empty");
        
        credentialStatuses[credentialId] = newStatus;
        credentialIssuers[credentialId] = msg.sender;
        
        emit CredentialStatusUpdated(credentialId, newStatus, msg.sender);
    }

    /**
     * @dev Gets the status of a credential
     * @param credentialId The unique identifier of the credential
     * @return credentialStatus The current status of the credential
     * @return issuer The address of the credential issuer
     */
    function getCredential(string memory credentialId) external view returns (string memory credentialStatus, address issuer) {
        return (credentialStatuses[credentialId], credentialIssuers[credentialId]);
    }

    /**
     * @dev Gets credentials for a worker (placeholder - returns empty for now)
     * @param workerDid The DID of the worker
     * @return An empty array (to be implemented based on specific requirements)
     */
    function getWorkerCredentials(string memory workerDid) external view returns (string[] memory) {
        // This is a placeholder implementation
        // In a real system, you'd need to track which credentials belong to which worker
        string[] memory emptyArray = new string[](0);
        return emptyArray;
    }
}
