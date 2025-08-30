"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escrowService = exports.EscrowService = void 0;
const supabase_1 = require("../config/supabase");
class EscrowService {
    /**
     * Record an escrow deposit
     */
    async recordEscrowDeposit(depositData) {
        const { data, error } = await supabase_1.supabase
            .from('escrow_deposits')
            .insert({
            ...depositData,
            status: 'Active',
            deposited_at: new Date().toISOString()
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to record escrow deposit: ${error.message}`);
        }
        return data;
    }
    /**
     * Get escrow deposit by employment contract address
     */
    async getEscrowDeposit(employmentContractAddress) {
        const { data, error } = await supabase_1.supabase
            .from('escrow_deposits')
            .select('*')
            .eq('employment_contract_address', employmentContractAddress)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            throw new Error(`Failed to get escrow deposit: ${error.message}`);
        }
        return data;
    }
    /**
     * Get all escrow deposits for an employer
     */
    async getEmployerEscrows(employerAddress) {
        const { data, error } = await supabase_1.supabase
            .from('escrow_deposits')
            .select('*')
            .eq('employer_address', employerAddress)
            .order('deposited_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to get employer escrows: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Get all escrow deposits for a worker
     */
    async getWorkerEscrows(workerAddress) {
        const { data, error } = await supabase_1.supabase
            .from('escrow_deposits')
            .select('*')
            .eq('worker_address', workerAddress)
            .order('deposited_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to get worker escrows: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Update escrow status when released
     */
    async updateEscrowStatus(employmentContractAddress, status, releaseReason) {
        const updateData = {
            status,
            released_at: new Date().toISOString()
        };
        if (releaseReason) {
            updateData.release_reason = releaseReason;
        }
        const { data, error } = await supabase_1.supabase
            .from('escrow_deposits')
            .update(updateData)
            .eq('employment_contract_address', employmentContractAddress)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update escrow status: ${error.message}`);
        }
        return data;
    }
    /**
     * Get all active escrow deposits
     */
    async getActiveEscrows() {
        const { data, error } = await supabase_1.supabase
            .from('escrow_deposits')
            .select('*')
            .eq('status', 'Active')
            .order('deposited_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to get active escrows: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Get all disputed escrow deposits
     */
    async getDisputedEscrows() {
        const { data, error } = await supabase_1.supabase
            .from('escrow_deposits')
            .select('*')
            .eq('status', 'Disputed')
            .order('deposited_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to get disputed escrows: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Get escrow statistics
     */
    async getEscrowStatistics() {
        // Get total amounts
        const { data: totalData, error: totalError } = await supabase_1.supabase
            .from('escrow_deposits')
            .select('deposit_amount, status');
        if (totalError) {
            throw new Error(`Failed to get escrow statistics: ${totalError.message}`);
        }
        const stats = {
            totalEscrowed: 0,
            totalReleased: 0,
            activeCount: 0,
            disputedCount: 0,
            releasedCount: 0
        };
        if (totalData) {
            for (const deposit of totalData) {
                if (deposit.status === 'Active') {
                    stats.totalEscrowed += deposit.deposit_amount;
                    stats.activeCount++;
                }
                else if (deposit.status === 'Released') {
                    stats.totalReleased += deposit.deposit_amount;
                    stats.releasedCount++;
                }
                else if (deposit.status === 'Disputed') {
                    stats.disputedCount++;
                }
            }
        }
        return stats;
    }
    /**
     * Check if employment contract has sufficient escrow
     */
    async verifyEscrowSufficiency(employmentContractAddress, requiredAmount) {
        const escrow = await this.getEscrowDeposit(employmentContractAddress);
        if (!escrow || escrow.status !== 'Active') {
            return false;
        }
        return escrow.deposit_amount >= requiredAmount;
    }
    /**
     * Get employer's total escrowed amount
     */
    async getEmployerTotalEscrowed(employerAddress) {
        const { data, error } = await supabase_1.supabase
            .from('escrow_deposits')
            .select('deposit_amount')
            .eq('employer_address', employerAddress)
            .eq('status', 'Active');
        if (error) {
            throw new Error(`Failed to get employer total escrowed: ${error.message}`);
        }
        if (!data)
            return 0;
        return data.reduce((total, deposit) => total + deposit.deposit_amount, 0);
    }
    /**
     * Get escrow deposits that need attention (old active deposits)
     */
    async getEscrowsNeedingAttention(daysOld = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const { data, error } = await supabase_1.supabase
            .from('escrow_deposits')
            .select('*')
            .eq('status', 'Active')
            .lt('deposited_at', cutoffDate.toISOString())
            .order('deposited_at', { ascending: true });
        if (error) {
            throw new Error(`Failed to get escrows needing attention: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Calculate escrow requirement based on salary and frequency
     */
    calculateEscrowRequirement(salary, payFrequencyDays) {
        // Default to 2 months salary as escrow requirement
        const monthsRequired = 2;
        const daysInMonth = 30;
        const payPeriodsPerMonth = daysInMonth / payFrequencyDays;
        const monthlySalary = salary * payPeriodsPerMonth;
        return monthlySalary * monthsRequired;
    }
    /**
     * Check escrow compliance for multiple contracts
     */
    async checkEscrowCompliance(employmentContractAddresses) {
        const compliant = [];
        const nonCompliant = [];
        const details = {};
        for (const contractAddress of employmentContractAddresses) {
            const escrow = await this.getEscrowDeposit(contractAddress);
            if (escrow && escrow.status === 'Active' && escrow.deposit_amount > 0) {
                compliant.push(contractAddress);
                details[contractAddress] = {
                    hasEscrow: true,
                    amount: escrow.deposit_amount,
                    status: escrow.status
                };
            }
            else {
                nonCompliant.push(contractAddress);
                details[contractAddress] = {
                    hasEscrow: !!escrow,
                    amount: escrow?.deposit_amount || 0,
                    status: escrow?.status || 'None'
                };
            }
        }
        return { compliant, nonCompliant, details };
    }
}
exports.EscrowService = EscrowService;
exports.escrowService = new EscrowService();
