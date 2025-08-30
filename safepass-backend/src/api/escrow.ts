import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { escrowService } from '../services/escrowService';

const router = Router();

/**
 * Record escrow deposit (System use - called when blockchain deposit is made)
 */
router.post('/deposits', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.user as any;
    
    if (role !== 'Regulator') {
      return res.status(403).json({ error: 'Access denied. Only regulators can record escrow deposits.' });
    }

    const {
      employment_contract_address,
      employer_address,
      worker_address,
      deposit_amount,
      transaction_hash
    } = req.body;

    if (!employment_contract_address || !employer_address || !worker_address || !deposit_amount || !transaction_hash) {
      return res.status(400).json({ 
        error: 'Missing required fields: employment_contract_address, employer_address, worker_address, deposit_amount, transaction_hash' 
      });
    }

    const deposit = await escrowService.recordEscrowDeposit({
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
  } catch (error: any) {
    console.error('Error recording escrow deposit:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get escrow deposit by employment contract address
 */
router.get('/deposits/:contractAddress', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { contractAddress } = req.params;

    const deposit = await escrowService.getEscrowDeposit(contractAddress);

    if (!deposit) {
      return res.status(404).json({ error: 'Escrow deposit not found for this contract' });
    }

    res.json({
      message: 'Escrow deposit retrieved successfully',
      data: deposit
    });
  } catch (error: any) {
    console.error('Error getting escrow deposit:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get employer's escrow deposits
 */
router.get('/employer/:employerAddress', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.user as any;
    const { employerAddress } = req.params;
    
    // Allow employers to view their own escrows, regulators to view any
    if (role !== 'Regulator' && role !== 'AgencyAdmin') {
      return res.status(403).json({ error: 'Access denied. Only regulators and agency admins can view escrow deposits.' });
    }

    const deposits = await escrowService.getEmployerEscrows(employerAddress);

    res.json({
      message: 'Employer escrow deposits retrieved successfully',
      data: deposits,
      count: deposits.length
    });
  } catch (error: any) {
    console.error('Error getting employer escrows:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get worker's escrow deposits
 */
router.get('/worker/:workerAddress', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.user as any;
    const { workerAddress } = req.params;
    
    // Allow workers to view their own escrows, regulators to view any
    if (role !== 'Regulator' && role !== 'Worker') {
      return res.status(403).json({ error: 'Access denied. Only regulators and workers can view worker escrow deposits.' });
    }

    const deposits = await escrowService.getWorkerEscrows(workerAddress);

    res.json({
      message: 'Worker escrow deposits retrieved successfully',
      data: deposits,
      count: deposits.length
    });
  } catch (error: any) {
    console.error('Error getting worker escrows:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update escrow status (Regulator only)
 */
router.put('/deposits/:contractAddress/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.user as any;
    
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

    const updatedDeposit = await escrowService.updateEscrowStatus(contractAddress, status, release_reason);

    res.json({
      message: 'Escrow status updated successfully',
      data: updatedDeposit
    });
  } catch (error: any) {
    console.error('Error updating escrow status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all active escrow deposits (Regulator only)
 */
router.get('/active', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.user as any;
    
    if (role !== 'Regulator') {
      return res.status(403).json({ error: 'Access denied. Only regulators can view all active escrows.' });
    }

    const activeEscrows = await escrowService.getActiveEscrows();

    res.json({
      message: 'Active escrow deposits retrieved successfully',
      data: activeEscrows,
      count: activeEscrows.length
    });
  } catch (error: any) {
    console.error('Error getting active escrows:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all disputed escrow deposits (Regulator only)
 */
router.get('/disputed', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.user as any;
    
    if (role !== 'Regulator') {
      return res.status(403).json({ error: 'Access denied. Only regulators can view disputed escrows.' });
    }

    const disputedEscrows = await escrowService.getDisputedEscrows();

    res.json({
      message: 'Disputed escrow deposits retrieved successfully',
      data: disputedEscrows,
      count: disputedEscrows.length
    });
  } catch (error: any) {
    console.error('Error getting disputed escrows:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get escrow statistics (Regulator only)
 */
router.get('/statistics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.user as any;
    
    if (role !== 'Regulator') {
      return res.status(403).json({ error: 'Access denied. Only regulators can view escrow statistics.' });
    }

    const stats = await escrowService.getEscrowStatistics();

    res.json({
      message: 'Escrow statistics retrieved successfully',
      data: stats
    });
  } catch (error: any) {
    console.error('Error getting escrow statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify escrow sufficiency for a contract
 */
router.get('/verify/:contractAddress/:requiredAmount', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { contractAddress, requiredAmount } = req.params;

    const isSufficient = await escrowService.verifyEscrowSufficiency(
      contractAddress,
      parseFloat(requiredAmount)
    );

    res.json({
      message: 'Escrow sufficiency verified',
      data: {
        employment_contract_address: contractAddress,
        required_amount: parseFloat(requiredAmount),
        is_sufficient: isSufficient,
        verified_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error verifying escrow sufficiency:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get employer's total escrowed amount
 */
router.get('/employer/:employerAddress/total', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.user as any;
    const { employerAddress } = req.params;
    
    if (role !== 'Regulator' && role !== 'AgencyAdmin') {
      return res.status(403).json({ error: 'Access denied. Only regulators and agency admins can view total escrowed amounts.' });
    }

    const totalEscrowed = await escrowService.getEmployerTotalEscrowed(employerAddress);

    res.json({
      message: 'Employer total escrowed amount retrieved successfully',
      data: {
        employer_address: employerAddress,
        total_escrowed: totalEscrowed,
        retrieved_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error getting employer total escrowed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get escrows needing attention (old active deposits)
 */
router.get('/attention', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.user as any;
    
    if (role !== 'Regulator') {
      return res.status(403).json({ error: 'Access denied. Only regulators can view escrows needing attention.' });
    }

    const { days } = req.query;
    const daysOld = days ? parseInt(days as string) : 90;

    const escrowsNeedingAttention = await escrowService.getEscrowsNeedingAttention(daysOld);

    res.json({
      message: 'Escrows needing attention retrieved successfully',
      data: escrowsNeedingAttention,
      count: escrowsNeedingAttention.length,
      criteria: `Active for more than ${daysOld} days`
    });
  } catch (error: any) {
    console.error('Error getting escrows needing attention:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Calculate escrow requirement
 */
router.post('/calculate-requirement', async (req: Request, res: Response) => {
  try {
    const { salary, pay_frequency_days } = req.body;

    if (!salary || !pay_frequency_days) {
      return res.status(400).json({ 
        error: 'Missing required fields: salary, pay_frequency_days' 
      });
    }

    const requirement = escrowService.calculateEscrowRequirement(
      parseFloat(salary),
      parseInt(pay_frequency_days)
    );

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
  } catch (error: any) {
    console.error('Error calculating escrow requirement:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check escrow compliance for multiple contracts
 */
router.post('/compliance-check', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { role } = req.user as any;
    
    if (role !== 'Regulator') {
      return res.status(403).json({ error: 'Access denied. Only regulators can check escrow compliance.' });
    }

    const { contract_addresses } = req.body;

    if (!contract_addresses || !Array.isArray(contract_addresses)) {
      return res.status(400).json({ 
        error: 'Missing or invalid contract_addresses array' 
      });
    }

    const compliance = await escrowService.checkEscrowCompliance(contract_addresses);

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
  } catch (error: any) {
    console.error('Error checking escrow compliance:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
