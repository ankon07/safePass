// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EscrowContract
 * @dev Manages escrow deposits for employment contracts to ensure financial guarantees
 * Implements Pillar 2: Financial Incentives & Guarantees
 */
contract EscrowContract is Ownable, ReentrancyGuard {
    
    // Escrow status enumeration
    enum EscrowStatus {
        Pending,
        Active,
        Released,
        Disputed
    }

    // Escrow deposit structure
    struct EscrowDeposit {
        address employer;
        address worker;
        address employmentContract;
        uint256 depositAmount;
        uint256 depositedAt;
        EscrowStatus status;
        bool isReleased;
        address releasedTo;
        uint256 releasedAt;
        string releaseReason;
    }

    // State variables
    mapping(address => EscrowDeposit) public escrows; // employmentContract => deposit
    mapping(address => uint256) public employerBalances; // employer => total deposited
    mapping(address => address[]) public employerContracts; // employer => contract addresses
    
    address public regulator; // BMET or trusted authority
    uint256 public minimumDepositRatio = 2; // 2 months salary minimum
    uint256 public totalEscrowed;
    uint256 public totalReleased;

    // Events
    event EscrowDeposited(
        address indexed employmentContract,
        address indexed employer,
        address indexed worker,
        uint256 amount
    );
    
    event EscrowReleased(
        address indexed employmentContract,
        address indexed releasedTo,
        uint256 amount,
        string reason
    );
    
    event EscrowDisputed(
        address indexed employmentContract,
        address indexed disputeRaiser
    );
    
    event RegulatorChanged(address indexed oldRegulator, address indexed newRegulator);
    event MinimumDepositRatioChanged(uint256 oldRatio, uint256 newRatio);

    // Modifiers
    modifier onlyRegulator() {
        require(msg.sender == regulator, "Only regulator can call this function");
        _;
    }

    modifier onlyEmploymentContract() {
        require(escrows[msg.sender].employmentContract == msg.sender, "Only associated employment contract can call");
        _;
    }

    modifier escrowExists(address _employmentContract) {
        require(escrows[_employmentContract].employmentContract != address(0), "Escrow does not exist");
        _;
    }

    /**
     * @dev Constructor sets the regulator and owner
     * @param _regulator Address of the regulator (BMET)
     */
    constructor(address _regulator) Ownable(msg.sender) {
        require(_regulator != address(0), "Regulator address cannot be zero");
        regulator = _regulator;
    }

    /**
     * @dev Deposit escrow for an employment contract
     * @param _employmentContract Address of the employment contract
     * @param _worker Address of the worker
     */
    function depositEscrow(address _employmentContract, address _worker) external payable nonReentrant {
        require(_employmentContract != address(0), "Employment contract address cannot be zero");
        require(_worker != address(0), "Worker address cannot be zero");
        require(msg.value > 0, "Deposit amount must be greater than zero");
        require(escrows[_employmentContract].employmentContract == address(0), "Escrow already exists for this contract");

        // Create escrow deposit
        escrows[_employmentContract] = EscrowDeposit({
            employer: msg.sender,
            worker: _worker,
            employmentContract: _employmentContract,
            depositAmount: msg.value,
            depositedAt: block.timestamp,
            status: EscrowStatus.Active,
            isReleased: false,
            releasedTo: address(0),
            releasedAt: 0,
            releaseReason: ""
        });

        // Update employer balance and contracts
        employerBalances[msg.sender] += msg.value;
        employerContracts[msg.sender].push(_employmentContract);
        totalEscrowed += msg.value;

        // Notify the employment contract about the deposit
        (bool success, ) = _employmentContract.call(
            abi.encodeWithSignature("confirmEscrowDeposit(uint256)", msg.value)
        );
        require(success, "Failed to confirm escrow deposit with employment contract");

        emit EscrowDeposited(_employmentContract, msg.sender, _worker, msg.value);
    }

    /**
     * @dev Release escrow to worker (Regulator only)
     * @param _employmentContract Address of the employment contract
     * @param _reason Reason for release
     */
    function releaseEscrowToWorker(address _employmentContract, string memory _reason) 
        external 
        onlyRegulator 
        escrowExists(_employmentContract) 
        nonReentrant 
    {
        EscrowDeposit storage escrow = escrows[_employmentContract];
        require(escrow.status == EscrowStatus.Active || escrow.status == EscrowStatus.Disputed, "Escrow not available for release");
        require(!escrow.isReleased, "Escrow already released");

        uint256 amount = escrow.depositAmount;
        address worker = escrow.worker;

        // Update escrow status
        escrow.status = EscrowStatus.Released;
        escrow.isReleased = true;
        escrow.releasedTo = worker;
        escrow.releasedAt = block.timestamp;
        escrow.releaseReason = _reason;

        // Update balances
        employerBalances[escrow.employer] -= amount;
        totalReleased += amount;

        // Transfer funds to worker
        (bool success, ) = payable(worker).call{value: amount}("");
        require(success, "Failed to transfer funds to worker");

        emit EscrowReleased(_employmentContract, worker, amount, _reason);
    }

    /**
     * @dev Release escrow to employer (Regulator only)
     * @param _employmentContract Address of the employment contract
     * @param _reason Reason for release
     */
    function releaseEscrowToEmployer(address _employmentContract, string memory _reason) 
        external 
        onlyRegulator 
        escrowExists(_employmentContract) 
        nonReentrant 
    {
        EscrowDeposit storage escrow = escrows[_employmentContract];
        require(escrow.status == EscrowStatus.Active, "Escrow not available for release");
        require(!escrow.isReleased, "Escrow already released");

        uint256 amount = escrow.depositAmount;
        address employer = escrow.employer;

        // Update escrow status
        escrow.status = EscrowStatus.Released;
        escrow.isReleased = true;
        escrow.releasedTo = employer;
        escrow.releasedAt = block.timestamp;
        escrow.releaseReason = _reason;

        // Update balances
        employerBalances[employer] -= amount;
        totalReleased += amount;

        // Transfer funds to employer
        (bool success, ) = payable(employer).call{value: amount}("");
        require(success, "Failed to transfer funds to employer");

        emit EscrowReleased(_employmentContract, employer, amount, _reason);
    }

    /**
     * @dev Handle dispute by marking escrow as disputed
     * @param _employmentContract Address of the employment contract
     */
    function handleDispute(address _employmentContract) 
        external 
        escrowExists(_employmentContract) 
    {
        EscrowDeposit storage escrow = escrows[_employmentContract];
        require(
            msg.sender == escrow.worker || msg.sender == escrow.employer || msg.sender == regulator,
            "Only contract parties or regulator can raise dispute"
        );
        require(escrow.status == EscrowStatus.Active, "Escrow not in active state");
        require(!escrow.isReleased, "Escrow already released");

        escrow.status = EscrowStatus.Disputed;
        emit EscrowDisputed(_employmentContract, msg.sender);
    }

    /**
     * @dev Get escrow status and details
     * @param _employmentContract Address of the employment contract
     * @return Escrow deposit details
     */
    function getEscrowStatus(address _employmentContract) 
        external 
        view 
        escrowExists(_employmentContract)
        returns (EscrowDeposit memory) 
    {
        return escrows[_employmentContract];
    }

    /**
     * @dev Verify if escrow deposit meets minimum requirement
     * @param _employmentContract Address of the employment contract
     * @param _requiredAmount Minimum required amount
     * @return True if deposit is sufficient
     */
    function verifyDeposit(address _employmentContract, uint256 _requiredAmount) 
        external 
        view 
        returns (bool) 
    {
        EscrowDeposit memory escrow = escrows[_employmentContract];
        return escrow.depositAmount >= _requiredAmount && escrow.status == EscrowStatus.Active;
    }

    /**
     * @dev Get employer's total escrowed amount
     * @param _employer Address of the employer
     * @return Total amount escrowed by employer
     */
    function getEmployerBalance(address _employer) external view returns (uint256) {
        return employerBalances[_employer];
    }

    /**
     * @dev Get all employment contracts for an employer
     * @param _employer Address of the employer
     * @return Array of employment contract addresses
     */
    function getEmployerContracts(address _employer) external view returns (address[] memory) {
        return employerContracts[_employer];
    }

    /**
     * @dev Get total escrow statistics
     * @return totalEscrowed Total amount currently escrowed
     * @return totalReleased Total amount released
     * @return activeEscrows Total active escrows
     */
    function getEscrowStatistics() external view returns (uint256, uint256, uint256) {
        // Note: activeEscrows calculation would require additional tracking
        // For now, returning 0 as placeholder
        return (totalEscrowed, totalReleased, 0);
    }

    /**
     * @dev Set minimum deposit ratio (Owner only)
     * @param _ratio New minimum deposit ratio (in months)
     */
    function setMinimumDepositRatio(uint256 _ratio) external onlyOwner {
        require(_ratio > 0, "Ratio must be greater than zero");
        uint256 oldRatio = minimumDepositRatio;
        minimumDepositRatio = _ratio;
        emit MinimumDepositRatioChanged(oldRatio, _ratio);
    }

    /**
     * @dev Change regulator address (Owner only)
     * @param _newRegulator New regulator address
     */
    function setRegulator(address _newRegulator) external onlyOwner {
        require(_newRegulator != address(0), "New regulator address cannot be zero");
        address oldRegulator = regulator;
        regulator = _newRegulator;
        emit RegulatorChanged(oldRegulator, _newRegulator);
    }

    /**
     * @dev Emergency withdrawal function (Owner only)
     * Only for emergency situations, requires careful governance
     * @param _to Address to send funds to
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address payable _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Withdrawal address cannot be zero");
        require(_amount <= address(this).balance, "Insufficient contract balance");
        
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Emergency withdrawal failed");
    }

    /**
     * @dev Get contract balance
     * @return Current contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Fallback function to receive Ether
     */
    receive() external payable {
        // Allow contract to receive Ether
    }
}
