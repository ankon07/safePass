"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const insuranceService_1 = require("../services/insuranceService");
const router = (0, express_1.Router)();
/**
 * Register or update insurance bond (Regulator only)
 */
router.post('/bonds', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can register insurance bonds.' });
        }
        const { agency_address, policy_number, coverage_amount, expiry_date, insurance_provider, verifiable_credential } = req.body;
        if (!agency_address || !policy_number || !coverage_amount || !expiry_date || !insurance_provider) {
            return res.status(400).json({
                error: 'Missing required fields: agency_address, policy_number, coverage_amount, expiry_date, insurance_provider'
            });
        }
        const bond = await insuranceService_1.insuranceService.registerInsuranceBond({
            agency_address,
            policy_number,
            coverage_amount: parseFloat(coverage_amount),
            expiry_date,
            insurance_provider,
            credential_jwt: verifiable_credential
        });
        res.status(201).json({
            message: 'Insurance bond registered successfully',
            data: bond
        });
    }
    catch (error) {
        console.error('Error registering insurance bond:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get insurance bond for an agency
 */
router.get('/bonds/:agencyAddress', async (req, res) => {
    try {
        const { agencyAddress } = req.params;
        const bond = await insuranceService_1.insuranceService.getInsuranceBond(agencyAddress);
        if (!bond) {
            return res.status(404).json({ error: 'Insurance bond not found for this agency' });
        }
        res.json({
            message: 'Insurance bond retrieved successfully',
            data: bond
        });
    }
    catch (error) {
        console.error('Error getting insurance bond:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Verify insurance status for an agency
 */
router.get('/bonds/:agencyAddress/verify', async (req, res) => {
    try {
        const { agencyAddress } = req.params;
        const isValid = await insuranceService_1.insuranceService.verifyInsuranceStatus(agencyAddress);
        res.json({
            message: 'Insurance status verified',
            data: {
                agency_address: agencyAddress,
                is_valid: isValid,
                verified_at: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error verifying insurance status:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get agencies with expired insurance
 */
router.get('/expired', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can view expired insurance bonds.' });
        }
        const expiredBonds = await insuranceService_1.insuranceService.getAgenciesWithExpiredInsurance();
        res.json({
            message: 'Expired insurance bonds retrieved successfully',
            data: expiredBonds,
            count: expiredBonds.length
        });
    }
    catch (error) {
        console.error('Error getting expired insurance bonds:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get agencies with valid insurance
 */
router.get('/valid', async (req, res) => {
    try {
        const validBonds = await insuranceService_1.insuranceService.getAgenciesWithValidInsurance();
        res.json({
            message: 'Valid insurance bonds retrieved successfully',
            data: validBonds,
            count: validBonds.length
        });
    }
    catch (error) {
        console.error('Error getting valid insurance bonds:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Deactivate insurance bond (Regulator only)
 */
router.post('/bonds/:agencyAddress/deactivate', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can deactivate insurance bonds.' });
        }
        const { agencyAddress } = req.params;
        await insuranceService_1.insuranceService.deactivateInsuranceBond(agencyAddress);
        res.json({
            message: 'Insurance bond deactivated successfully',
            data: {
                agency_address: agencyAddress,
                deactivated_at: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error deactivating insurance bond:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * File insurance claim (Regulator only)
 */
router.post('/claims', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can file insurance claims.' });
        }
        const { agency_address, employment_contract_address, claim_amount, claim_reason } = req.body;
        if (!agency_address || !employment_contract_address || !claim_amount || !claim_reason) {
            return res.status(400).json({
                error: 'Missing required fields: agency_address, employment_contract_address, claim_amount, claim_reason'
            });
        }
        const claim = await insuranceService_1.insuranceService.fileInsuranceClaim({
            agency_address,
            employment_contract_address,
            claim_amount: parseFloat(claim_amount),
            claim_reason
        });
        res.status(201).json({
            message: 'Insurance claim filed successfully',
            data: claim
        });
    }
    catch (error) {
        console.error('Error filing insurance claim:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Update claim status (Regulator only)
 */
router.put('/claims/:claimId', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can update claim status.' });
        }
        const { claimId } = req.params;
        const { status, resolution_notes } = req.body;
        if (!status || !['Approved', 'Rejected', 'Paid'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be one of: Approved, Rejected, Paid'
            });
        }
        const updatedClaim = await insuranceService_1.insuranceService.updateClaimStatus(claimId, status, resolution_notes);
        res.json({
            message: 'Claim status updated successfully',
            data: updatedClaim
        });
    }
    catch (error) {
        console.error('Error updating claim status:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get claims for an agency
 */
router.get('/claims/:agencyAddress', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        const { agencyAddress } = req.params;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can view agency claims.' });
        }
        const claims = await insuranceService_1.insuranceService.getAgencyClaims(agencyAddress);
        res.json({
            message: 'Agency claims retrieved successfully',
            data: claims,
            count: claims.length
        });
    }
    catch (error) {
        console.error('Error getting agency claims:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get all pending claims (Regulator only)
 */
router.get('/claims', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can view pending claims.' });
        }
        const pendingClaims = await insuranceService_1.insuranceService.getPendingClaims();
        res.json({
            message: 'Pending claims retrieved successfully',
            data: pendingClaims,
            count: pendingClaims.length
        });
    }
    catch (error) {
        console.error('Error getting pending claims:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Check insurance compliance for an agency
 */
router.get('/compliance/:agencyAddress', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can check insurance compliance.' });
        }
        const { agencyAddress } = req.params;
        const compliance = await insuranceService_1.insuranceService.checkInsuranceCompliance(agencyAddress);
        res.json({
            message: 'Insurance compliance checked successfully',
            data: compliance
        });
    }
    catch (error) {
        console.error('Error checking insurance compliance:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
