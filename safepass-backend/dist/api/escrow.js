"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const escrowService_1 = require("../services/escrowService");
const router = (0, express_1.Router)();
/**
 * Record escrow deposit (System use - called when blockchain deposit is made)
 */
router.post('/deposits', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can record escrow deposits.' });
        }
        const { employment_contract_address, employer_address, worker_address, deposit_amount, transaction_hash } = req.body;
        if (!employment_contract_address || !employer_address || !worker_address || !deposit_amount || !transaction_hash) {
            return res.status(400).json({
                error: 'Missing required fields: employment_contract_address, employer_address, worker_address, deposit_amount, transaction_hash'
            });
        }
        const deposit = await escrowService_1.escrowService.recordEscrowDeposit({
            employment_contract_address,
            employer_address,
            worker_address,
            deposit_amount: parseFloat(deposit_amount),
            transaction_hash
        });
        res.status(201).json({
            message: 'Escrow deposit recorded successfully',
            data: deposit
        });
    }
    catch (error) {
        console.error('Error recording escrow deposit:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get escrow deposit by employment contract address
 */
router.get('/deposits/:contractAddress', auth_1.authenticateToken, async (req, res) => {
    try {
        const { contractAddress } = req.params;
        const deposit = await escrowService_1.escrowService.getEscrowDeposit(contractAddress);
        if (!deposit) {
            return res.status(404).json({ error: 'Escrow deposit not found for this contract' });
        }
        res.json({
            message: 'Escrow deposit retrieved successfully',
            data: deposit
        });
    }
    catch (error) {
        console.error('Error getting escrow deposit:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get employer's escrow deposits
 */
router.get('/employer/:employerAddress', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        const { employerAddress } = req.params;
        // Allow employers to view their own escrows, regulators to view any
        if (role !== 'Regulator' && role !== 'AgencyAdmin') {
            return res.status(403).json({ error: 'Access denied. Only regulators and agency admins can view escrow deposits.' });
        }
        const deposits = await escrowService_1.escrowService.getEmployerEscrows(employerAddress);
        res.json({
            message: 'Employer escrow deposits retrieved successfully',
            data: deposits,
            count: deposits.length
        });
    }
    catch (error) {
        console.error('Error getting employer escrows:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get worker's escrow deposits
 */
router.get('/worker/:workerAddress', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        const { workerAddress } = req.params;
        // Allow workers to view their own escrows, regulators to view any
        if (role !== 'Regulator' && role !== 'Worker') {
            return res.status(403).json({ error: 'Access denied. Only regulators and workers can view worker escrow deposits.' });
        }
        const deposits = await escrowService_1.escrowService.getWorkerEscrows(workerAddress);
        res.json({
            message: 'Worker escrow deposits retrieved successfully',
            data: deposits,
            count: deposits.length
        });
    }
    catch (error) {
        console.error('Error getting worker escrows:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Update escrow status (Regulator only)
 */
router.put('/deposits/:contractAddress/status', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can update escrow status.' });
        }
        const { contractAddress } = req.params;
        const { status, release_reason } = req.body;
        if (!status || !['Released', 'Disputed'].includes(status)) {
            return res.status(400).json({
                error: 'Invalid status. Must be one of: Released, Disputed'
            });
        }
        const updatedDeposit = await escrowService_1.escrowService.updateEscrowStatus(contractAddress, status, release_reason);
        res.json({
            message: 'Escrow status updated successfully',
            data: updatedDeposit
        });
    }
    catch (error) {
        console.error('Error updating escrow status:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get all active escrow deposits (Regulator only)
 */
router.get('/active', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can view all active escrows.' });
        }
        const activeEscrows = await escrowService_1.escrowService.getActiveEscrows();
        res.json({
            message: 'Active escrow deposits retrieved successfully',
            data: activeEscrows,
            count: activeEscrows.length
        });
    }
    catch (error) {
        console.error('Error getting active escrows:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get all disputed escrow deposits (Regulator only)
 */
router.get('/disputed', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can view disputed escrows.' });
        }
        const disputedEscrows = await escrowService_1.escrowService.getDisputedEscrows();
        res.json({
            message: 'Disputed escrow deposits retrieved successfully',
            data: disputedEscrows,
            count: disputedEscrows.length
        });
    }
    catch (error) {
        console.error('Error getting disputed escrows:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get escrow statistics (Regulator only)
 */
router.get('/statistics', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can view escrow statistics.' });
        }
        const stats = await escrowService_1.escrowService.getEscrowStatistics();
        res.json({
            message: 'Escrow statistics retrieved successfully',
            data: stats
        });
    }
    catch (error) {
        console.error('Error getting escrow statistics:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Verify escrow sufficiency for a contract
 */
router.get('/verify/:contractAddress/:requiredAmount', auth_1.authenticateToken, async (req, res) => {
    try {
        const { contractAddress, requiredAmount } = req.params;
        const isSufficient = await escrowService_1.escrowService.verifyEscrowSufficiency(contractAddress, parseFloat(requiredAmount));
        res.json({
            message: 'Escrow sufficiency verified',
            data: {
                employment_contract_address: contractAddress,
                required_amount: parseFloat(requiredAmount),
                is_sufficient: isSufficient,
                verified_at: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error verifying escrow sufficiency:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get employer's total escrowed amount
 */
router.get('/employer/:employerAddress/total', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        const { employerAddress } = req.params;
        if (role !== 'Regulator' && role !== 'AgencyAdmin') {
            return res.status(403).json({ error: 'Access denied. Only regulators and agency admins can view total escrowed amounts.' });
        }
        const totalEscrowed = await escrowService_1.escrowService.getEmployerTotalEscrowed(employerAddress);
        res.json({
            message: 'Employer total escrowed amount retrieved successfully',
            data: {
                employer_address: employerAddress,
                total_escrowed: totalEscrowed,
                retrieved_at: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error getting employer total escrowed:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get escrows needing attention (old active deposits)
 */
router.get('/attention', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can view escrows needing attention.' });
        }
        const { days } = req.query;
        const daysOld = days ? parseInt(days) : 90;
        const escrowsNeedingAttention = await escrowService_1.escrowService.getEscrowsNeedingAttention(daysOld);
        res.json({
            message: 'Escrows needing attention retrieved successfully',
            data: escrowsNeedingAttention,
            count: escrowsNeedingAttention.length,
            criteria: `Active for more than ${daysOld} days`
        });
    }
    catch (error) {
        console.error('Error getting escrows needing attention:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Calculate escrow requirement
 */
router.post('/calculate-requirement', async (req, res) => {
    try {
        const { salary, pay_frequency_days } = req.body;
        if (!salary || !pay_frequency_days) {
            return res.status(400).json({
                error: 'Missing required fields: salary, pay_frequency_days'
            });
        }
        const requirement = escrowService_1.escrowService.calculateEscrowRequirement(parseFloat(salary), parseInt(pay_frequency_days));
        res.json({
            message: 'Escrow requirement calculated successfully',
            data: {
                salary: parseFloat(salary),
                pay_frequency_days: parseInt(pay_frequency_days),
                escrow_requirement: requirement,
                calculation_method: '2 months salary equivalent',
                calculated_at: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error calculating escrow requirement:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * Check escrow compliance for multiple contracts
 */
router.post('/compliance-check', auth_1.authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'Regulator') {
            return res.status(403).json({ error: 'Access denied. Only regulators can check escrow compliance.' });
        }
        const { contract_addresses } = req.body;
        if (!contract_addresses || !Array.isArray(contract_addresses)) {
            return res.status(400).json({
                error: 'Missing or invalid contract_addresses array'
            });
        }
        const compliance = await escrowService_1.escrowService.checkEscrowCompliance(contract_addresses);
        res.json({
            message: 'Escrow compliance check completed successfully',
            data: compliance,
            summary: {
                total_contracts: contract_addresses.length,
                compliant_count: compliance.compliant.length,
                non_compliant_count: compliance.nonCompliant.length,
                compliance_rate: `${((compliance.compliant.length / contract_addresses.length) * 100).toFixed(1)}%`
            }
        });
    }
    catch (error) {
        console.error('Error checking escrow compliance:', error);
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
