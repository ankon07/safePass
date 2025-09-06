"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insuranceService = exports.InsuranceService = void 0;
const supabase_1 = require("../config/supabase");
class InsuranceService {
    /**
     * Register or update an insurance bond for an agency
     */
    async registerInsuranceBond(bondData) {
        // First check if bond already exists for this agency
        const existingBond = await this.getInsuranceBond(bondData.agency_address);
        if (existingBond) {
            // Update existing bond
            const { data, error } = await supabase_1.supabase
                .from('insurance_bonds')
                .update({
                policy_number: bondData.policy_number,
                coverage_amount: bondData.coverage_amount,
                expiry_date: bondData.expiry_date,
                provider: bondData.insurance_provider,
                verifiable_credential: bondData.credential_jwt,
                status: 'Active',
                updated_at: new Date().toISOString()
            })
                .eq('agency_address', bondData.agency_address)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to update insurance bond: ${error.message}`);
            }
            return data;
        }
        else {
            // Insert new bond
            const { data, error } = await supabase_1.supabase
                .from('insurance_bonds')
                .insert({
                agency_address: bondData.agency_address,
                policy_number: bondData.policy_number,
                coverage_amount: bondData.coverage_amount,
                expiry_date: bondData.expiry_date,
                provider: bondData.insurance_provider,
                verifiable_credential: bondData.credential_jwt,
                status: 'Active'
            })
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to register insurance bond: ${error.message}`);
            }
            return data;
        }
    }
    /**
     * Get insurance bond for an agency
     */
    async getInsuranceBond(agencyAddress) {
        const { data, error } = await supabase_1.supabase
            .from('insurance_bonds')
            .select('*')
            .eq('agency_address', agencyAddress)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            throw new Error(`Failed to get insurance bond: ${error.message}`);
        }
        return data;
    }
    /**
     * Verify if an agency has valid insurance
     */
    async verifyInsuranceStatus(agencyAddress) {
        const bond = await this.getInsuranceBond(agencyAddress);
        if (!bond || bond.status !== 'Active') {
            return false;
        }
        const expiryDate = new Date(bond.expiry_date);
        const now = new Date();
        return expiryDate > now && bond.coverage_amount > 0;
    }
    /**
     * Get agencies with expired insurance
     */
    async getAgenciesWithExpiredInsurance() {
        const { data, error } = await supabase_1.supabase
            .from('insurance_bonds')
            .select('*')
            .or(`expiry_date.lt.${new Date().toISOString()},status.eq.Expired`)
            .gt('coverage_amount', 0);
        if (error) {
            throw new Error(`Failed to get expired insurance bonds: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Get agencies with valid insurance
     */
    async getAgenciesWithValidInsurance() {
        const { data, error } = await supabase_1.supabase
            .from('insurance_bonds')
            .select('*')
            .eq('status', 'Active')
            .gt('expiry_date', new Date().toISOString())
            .gt('coverage_amount', 0);
        if (error) {
            throw new Error(`Failed to get valid insurance bonds: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Deactivate insurance bond
     */
    async deactivateInsuranceBond(agencyAddress) {
        const { error } = await supabase_1.supabase
            .from('insurance_bonds')
            .update({
            status: 'Cancelled',
            updated_at: new Date().toISOString()
        })
            .eq('agency_address', agencyAddress);
        if (error) {
            throw new Error(`Failed to deactivate insurance bond: ${error.message}`);
        }
    }
    /**
     * File an insurance claim
     */
    async fileInsuranceClaim(claimData) {
        const { data, error } = await supabase_1.supabase
            .from('insurance_claims')
            .insert({
            ...claimData,
            status: 'Pending',
            filed_at: new Date().toISOString()
        })
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to file insurance claim: ${error.message}`);
        }
        return data;
    }
    /**
     * Update insurance claim status
     */
    async updateClaimStatus(claimId, status, resolutionNotes) {
        const { data, error } = await supabase_1.supabase
            .from('insurance_claims')
            .update({
            status,
            resolved_at: new Date().toISOString(),
            resolution_notes: resolutionNotes
        })
            .eq('id', claimId)
            .select()
            .single();
        if (error) {
            throw new Error(`Failed to update claim status: ${error.message}`);
        }
        return data;
    }
    /**
     * Get insurance claims for an agency
     */
    async getAgencyClaims(agencyAddress) {
        const { data, error } = await supabase_1.supabase
            .from('insurance_claims')
            .select('*')
            .eq('agency_address', agencyAddress)
            .order('filed_at', { ascending: false });
        if (error) {
            throw new Error(`Failed to get agency claims: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Get all pending insurance claims
     */
    async getPendingClaims() {
        const { data, error } = await supabase_1.supabase
            .from('insurance_claims')
            .select('*')
            .eq('status', 'Pending')
            .order('filed_at', { ascending: true });
        if (error) {
            throw new Error(`Failed to get pending claims: ${error.message}`);
        }
        return data || [];
    }
    /**
     * Calculate required coverage for an agency based on active contracts
     */
    async calculateRequiredCoverage(agencyAddress) {
        // This would typically query employment contracts to calculate total exposure
        // For now, return a default minimum coverage amount
        const minimumCoverage = 100000; // $100,000 minimum coverage
        // TODO: Implement logic to calculate based on:
        // - Number of active employment contracts
        // - Total salary commitments
        // - Historical claim patterns
        return minimumCoverage;
    }
    /**
     * Check if agency meets insurance requirements
     */
    async checkInsuranceCompliance(agencyAddress) {
        const bond = await this.getInsuranceBond(agencyAddress);
        const requiredCoverage = await this.calculateRequiredCoverage(agencyAddress);
        const issues = [];
        if (!bond) {
            issues.push('No insurance bond registered');
            return {
                isCompliant: false,
                requiredCoverage,
                currentCoverage: 0,
                issues
            };
        }
        if (bond.status !== 'Active') {
            issues.push('Insurance bond is inactive');
        }
        const expiryDate = new Date(bond.expiry_date);
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (expiryDate <= now) {
            issues.push('Insurance bond has expired');
        }
        else if (expiryDate <= thirtyDaysFromNow) {
            issues.push('Insurance bond expires within 30 days');
        }
        if (bond.coverage_amount < requiredCoverage) {
            issues.push(`Insufficient coverage: ${bond.coverage_amount} < ${requiredCoverage}`);
        }
        return {
            isCompliant: issues.length === 0,
            requiredCoverage,
            currentCoverage: bond.coverage_amount,
            issues
        };
    }
}
exports.InsuranceService = InsuranceService;
exports.insuranceService = new InsuranceService();
