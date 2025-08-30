// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgencyRegistry
 * @dev Central registry for recruitment agencies with dynamic trust scoring
 * Acts as the on-chain, public directory of all registered and verified recruitment agencies
 */
contract AgencyRegistry is Ownable {
    struct Agency {
        address owner; // The agency's primary wallet address
        string name;
        string did; // Agency's DID for identity verification
        uint256 trustScore; // Score from 0-1000 (scaled by 10 for precision)
        bool isRegistered;
        uint256 registeredAt;
        uint256 lastScoreUpdate;
    }

    // Insurance bond structure for Pillar 2 compliance
    struct InsuranceBond {
        string policyNumber;
        uint256 coverageAmount;
        uint256 expiryDate;
        address insuranceProvider;
        bool isActive;
        string credentialJWT; // Verifiable Credential for the bond
        uint256 lastUpdated;
    }

    // Mapping from agency address to agency data
    mapping(address => Agency) public agencies;
    
    // Mapping from agency address to insurance bond
    mapping(address => InsuranceBond) public agencyInsurance;
    
    // Array to keep track of all registered agencies
    address[] public agencyList;
    
    // Mapping to check if an agency is in the list (for gas optimization)
    mapping(address => bool) public isInList;

    // Events
    event AgencyRegistered(
        address indexed agencyAddress, 
        string name, 
        string did, 
        uint256 initialTrustScore
    );
    
    event TrustScoreUpdated(
        address indexed agencyAddress, 
        uint256 oldScore, 
        uint256 newScore,
        uint256 timestamp
    );
    
    event AgencyUpdated(
        address indexed agencyAddress,
        string newName,
        string newDid
    );

    event InsuranceBondUpdated(
        address indexed agencyAddress,
        string policyNumber,
        uint256 coverageAmount,
        uint256 expiryDate,
        address indexed insuranceProvider
    );

    event InsuranceBondExpired(
        address indexed agencyAddress,
        string policyNumber
    );

    // Modifiers
    modifier onlyRegisteredAgency(address _agencyAddress) {
        require(agencies[_agencyAddress].isRegistered, "Agency not registered");
        _;
    }

    constructor() Ownable(msg.sender) {
        // Constructor sets the deployer as the owner
    }

    /**
     * @dev Register a new recruitment agency
     * Only the owner (regulator/BMET contract) can add new agencies
     * @param _agencyAddress The agency's wallet address
     * @param _name The agency's name
     * @param _did The agency's DID for identity verification
     */
    function registerAgency(
        address _agencyAddress, 
        string memory _name,
        string memory _did
    ) public onlyOwner {
        require(_agencyAddress != address(0), "Invalid agency address");
        require(bytes(_name).length > 0, "Agency name cannot be empty");
        require(bytes(_did).length > 0, "Agency DID cannot be empty");
        require(!agencies[_agencyAddress].isRegistered, "Agency already registered");
        
        // Create new agency with default trust score of 100.0 (1000 scaled)
        agencies[_agencyAddress] = Agency({
            owner: _agencyAddress,
            name: _name,
            did: _did,
            trustScore: 1000, // Default score: 100.0 (scaled by 10)
            isRegistered: true,
            registeredAt: block.timestamp,
            lastScoreUpdate: block.timestamp
        });
        
        // Add to agency list if not already present
        if (!isInList[_agencyAddress]) {
            agencyList.push(_agencyAddress);
            isInList[_agencyAddress] = true;
        }

        emit AgencyRegistered(_agencyAddress, _name, _did, 1000);
    }

    /**
     * @dev Update an agency's trust score
     * Only the owner (backend service wallet) can update scores
     * @param _agencyAddress The agency's address
     * @param _newScore The new trust score (scaled by 10, so 1000 = 100.0)
     */
    function updateTrustScore(
        address _agencyAddress, 
        uint256 _newScore
    ) public onlyOwner onlyRegisteredAgency(_agencyAddress) {
        require(_newScore <= 2000, "Trust score cannot exceed 200.0"); // Max score 200.0
        
        uint256 oldScore = agencies[_agencyAddress].trustScore;
        agencies[_agencyAddress].trustScore = _newScore;
        agencies[_agencyAddress].lastScoreUpdate = block.timestamp;

        emit TrustScoreUpdated(_agencyAddress, oldScore, _newScore, block.timestamp);
    }

    /**
     * @dev Update agency information (name and DID)
     * Only the owner can update agency information
     * @param _agencyAddress The agency's address
     * @param _newName The new agency name
     * @param _newDid The new agency DID
     */
    function updateAgencyInfo(
        address _agencyAddress,
        string memory _newName,
        string memory _newDid
    ) public onlyOwner onlyRegisteredAgency(_agencyAddress) {
        require(bytes(_newName).length > 0, "Agency name cannot be empty");
        require(bytes(_newDid).length > 0, "Agency DID cannot be empty");
        
        agencies[_agencyAddress].name = _newName;
        agencies[_agencyAddress].did = _newDid;

        emit AgencyUpdated(_agencyAddress, _newName, _newDid);
    }

    /**
     * @dev Get agency information
     * @param _agencyAddress The agency's address
     * @return agency The complete agency information
     */
    function getAgency(address _agencyAddress) 
        public 
        view 
        onlyRegisteredAgency(_agencyAddress)
        returns (Agency memory agency) 
    {
        return agencies[_agencyAddress];
    }

    /**
     * @dev Get agency trust score
     * @param _agencyAddress The agency's address
     * @return trustScore The agency's current trust score (scaled by 10)
     */
    function getTrustScore(address _agencyAddress) 
        public 
        view 
        onlyRegisteredAgency(_agencyAddress)
        returns (uint256 trustScore) 
    {
        return agencies[_agencyAddress].trustScore;
    }

    /**
     * @dev Get the total number of registered agencies
     * @return count The number of registered agencies
     */
    function getAgencyCount() public view returns (uint256 count) {
        return agencyList.length;
    }

    /**
     * @dev Get agency address by index
     * @param _index The index in the agency list
     * @return agencyAddress The agency's address
     */
    function getAgencyByIndex(uint256 _index) 
        public 
        view 
        returns (address agencyAddress) 
    {
        require(_index < agencyList.length, "Index out of bounds");
        return agencyList[_index];
    }

    /**
     * @dev Get all registered agency addresses
     * @return addresses Array of all registered agency addresses
     */
    function getAllAgencies() public view returns (address[] memory addresses) {
        return agencyList;
    }

    /**
     * @dev Check if an agency is registered
     * @param _agencyAddress The agency's address to check
     * @return isRegistered True if the agency is registered
     */
    function isAgencyRegistered(address _agencyAddress) 
        public 
        view 
        returns (bool) 
    {
        return agencies[_agencyAddress].isRegistered;
    }

    /**
     * @dev Get agencies with trust score above a threshold
     * @param _minScore Minimum trust score threshold (scaled by 10)
     * @return qualifiedAgencies Array of agency addresses meeting the criteria
     */
    function getQualifiedAgencies(uint256 _minScore) 
        public 
        view 
        returns (address[] memory qualifiedAgencies) 
    {
        uint256 count = 0;
        
        // First pass: count qualified agencies
        for (uint256 i = 0; i < agencyList.length; i++) {
            if (agencies[agencyList[i]].trustScore >= _minScore) {
                count++;
            }
        }
        
        // Second pass: populate the result array
        qualifiedAgencies = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < agencyList.length; i++) {
            if (agencies[agencyList[i]].trustScore >= _minScore) {
                qualifiedAgencies[index] = agencyList[i];
                index++;
            }
        }
        
        return qualifiedAgencies;
    }

    /**
     * @dev Get top N agencies by trust score
     * @param _limit Maximum number of agencies to return
     * @return topAgencies Array of top agency addresses
     * @return scores Array of corresponding trust scores
     */
    function getTopAgencies(uint256 _limit) 
        public 
        view 
        returns (address[] memory topAgencies, uint256[] memory scores) 
    {
        uint256 totalAgencies = agencyList.length;
        uint256 returnCount = _limit > totalAgencies ? totalAgencies : _limit;
        
        topAgencies = new address[](returnCount);
        scores = new uint256[](returnCount);
        
        // Simple selection sort for top N (efficient for small N)
        address[] memory tempAgencies = new address[](totalAgencies);
        uint256[] memory tempScores = new uint256[](totalAgencies);
        
        // Copy all agencies and scores
        for (uint256 i = 0; i < totalAgencies; i++) {
            tempAgencies[i] = agencyList[i];
            tempScores[i] = agencies[agencyList[i]].trustScore;
        }
        
        // Sort and select top N
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 maxIndex = i;
            
            // Find the maximum in remaining elements
            for (uint256 j = i + 1; j < totalAgencies; j++) {
                if (tempScores[j] > tempScores[maxIndex]) {
                    maxIndex = j;
                }
            }
            
            // Swap if needed
            if (maxIndex != i) {
                (tempAgencies[i], tempAgencies[maxIndex]) = (tempAgencies[maxIndex], tempAgencies[i]);
                (tempScores[i], tempScores[maxIndex]) = (tempScores[maxIndex], tempScores[i]);
            }
            
            topAgencies[i] = tempAgencies[i];
            scores[i] = tempScores[i];
        }
        
        return (topAgencies, scores);
    }

    /**
     * @dev Update insurance bond for an agency (Owner only)
     * @param _agencyAddress The agency's address
     * @param _policyNumber Insurance policy number
     * @param _coverageAmount Coverage amount
     * @param _expiryDate Expiry date timestamp
     * @param _insuranceProvider Insurance provider address
     * @param _credentialJWT Verifiable credential JWT
     */
    function updateInsuranceBond(
        address _agencyAddress,
        string memory _policyNumber,
        uint256 _coverageAmount,
        uint256 _expiryDate,
        address _insuranceProvider,
        string memory _credentialJWT
    ) public onlyOwner onlyRegisteredAgency(_agencyAddress) {
        require(bytes(_policyNumber).length > 0, "Policy number cannot be empty");
        require(_coverageAmount > 0, "Coverage amount must be greater than zero");
        require(_expiryDate > block.timestamp, "Expiry date must be in the future");
        require(_insuranceProvider != address(0), "Insurance provider address cannot be zero");

        agencyInsurance[_agencyAddress] = InsuranceBond({
            policyNumber: _policyNumber,
            coverageAmount: _coverageAmount,
            expiryDate: _expiryDate,
            insuranceProvider: _insuranceProvider,
            isActive: true,
            credentialJWT: _credentialJWT,
            lastUpdated: block.timestamp
        });

        emit InsuranceBondUpdated(_agencyAddress, _policyNumber, _coverageAmount, _expiryDate, _insuranceProvider);
    }

    /**
     * @dev Verify insurance status for an agency
     * @param _agencyAddress The agency's address
     * @return isValid True if insurance is valid and not expired
     */
    function verifyInsuranceStatus(address _agencyAddress) public view returns (bool isValid) {
        InsuranceBond memory bond = agencyInsurance[_agencyAddress];
        return bond.isActive && bond.expiryDate > block.timestamp && bond.coverageAmount > 0;
    }

    /**
     * @dev Get insurance coverage amount for an agency
     * @param _agencyAddress The agency's address
     * @return coverageAmount The coverage amount
     */
    function getInsuranceCoverage(address _agencyAddress) public view returns (uint256 coverageAmount) {
        return agencyInsurance[_agencyAddress].coverageAmount;
    }

    /**
     * @dev Get complete insurance bond information
     * @param _agencyAddress The agency's address
     * @return bond The complete insurance bond information
     */
    function getInsuranceBond(address _agencyAddress) public view returns (InsuranceBond memory bond) {
        return agencyInsurance[_agencyAddress];
    }

    /**
     * @dev Check if agency has valid insurance bond
     * @param _agencyAddress The agency's address
     * @return hasValidInsurance True if agency has valid, non-expired insurance
     */
    function hasValidInsurance(address _agencyAddress) public view returns (bool hasValidInsurance) {
        InsuranceBond memory bond = agencyInsurance[_agencyAddress];
        return bond.isActive && 
               bond.expiryDate > block.timestamp && 
               bond.coverageAmount > 0 && 
               bytes(bond.policyNumber).length > 0;
    }

    /**
     * @dev Deactivate insurance bond (Owner only)
     * @param _agencyAddress The agency's address
     */
    function deactivateInsuranceBond(address _agencyAddress) public onlyOwner onlyRegisteredAgency(_agencyAddress) {
        InsuranceBond storage bond = agencyInsurance[_agencyAddress];
        require(bond.isActive, "Insurance bond is already inactive");
        
        bond.isActive = false;
        bond.lastUpdated = block.timestamp;
        
        emit InsuranceBondExpired(_agencyAddress, bond.policyNumber);
    }

    /**
     * @dev Get agencies with valid insurance bonds
     * @return insuredAgencies Array of agency addresses with valid insurance
     */
    function getInsuredAgencies() public view returns (address[] memory insuredAgencies) {
        uint256 count = 0;
        
        // First pass: count agencies with valid insurance
        for (uint256 i = 0; i < agencyList.length; i++) {
            if (hasValidInsurance(agencyList[i])) {
                count++;
            }
        }
        
        // Second pass: populate the result array
        insuredAgencies = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < agencyList.length; i++) {
            if (hasValidInsurance(agencyList[i])) {
                insuredAgencies[index] = agencyList[i];
                index++;
            }
        }
        
        return insuredAgencies;
    }

    /**
     * @dev Get agencies with expired insurance bonds
     * @return expiredAgencies Array of agency addresses with expired insurance
     */
    function getAgenciesWithExpiredInsurance() public view returns (address[] memory expiredAgencies) {
        uint256 count = 0;
        
        // First pass: count agencies with expired insurance
        for (uint256 i = 0; i < agencyList.length; i++) {
            InsuranceBond memory bond = agencyInsurance[agencyList[i]];
            if (bond.coverageAmount > 0 && (bond.expiryDate <= block.timestamp || !bond.isActive)) {
                count++;
            }
        }
        
        // Second pass: populate the result array
        expiredAgencies = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < agencyList.length; i++) {
            InsuranceBond memory bond = agencyInsurance[agencyList[i]];
            if (bond.coverageAmount > 0 && (bond.expiryDate <= block.timestamp || !bond.isActive)) {
                expiredAgencies[index] = agencyList[i];
                index++;
            }
        }
        
        return expiredAgencies;
    }

    /**
     * @dev Get qualified agencies with both good trust score and valid insurance
     * @param _minScore Minimum trust score threshold
     * @return qualifiedAgencies Array of fully qualified agency addresses
     */
    function getFullyQualifiedAgencies(uint256 _minScore) public view returns (address[] memory qualifiedAgencies) {
        uint256 count = 0;
        
        // First pass: count fully qualified agencies
        for (uint256 i = 0; i < agencyList.length; i++) {
            if (agencies[agencyList[i]].trustScore >= _minScore && hasValidInsurance(agencyList[i])) {
                count++;
            }
        }
        
        // Second pass: populate the result array
        qualifiedAgencies = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < agencyList.length; i++) {
            if (agencies[agencyList[i]].trustScore >= _minScore && hasValidInsurance(agencyList[i])) {
                qualifiedAgencies[index] = agencyList[i];
                index++;
            }
        }
        
        return qualifiedAgencies;
    }
}
