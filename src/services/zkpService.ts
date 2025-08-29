import * as snarkjs from 'snarkjs';
import { supabase } from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

interface ZKPProof {
  proof: any;
  publicSignals: any[];
  proofId?: string;
}

class ZKPService {
  private circuitWasmPath: string;
  private circuitZkeyPath: string;
  private verificationKeyPath: string;

  constructor() {
    // Set up paths for ZKP files
    this.circuitWasmPath = path.join(process.cwd(), 'zkp/build/licenseVerifier_js/licenseVerifier.wasm');
    this.circuitZkeyPath = path.join(process.cwd(), 'zkp/keys/licenseVerifier_0000.zkey');
    this.verificationKeyPath = path.join(process.cwd(), 'zkp/build/verification_key.json');
  }

  /**
   * Generate a ZKP proof for license verification using simple membership proof
   * @param licenseNumber - The agency's license number (private input)
   * @param agencyId - The agency's database ID (for RLS compliance)
   * @param agencyAddress - The agency's blockchain address (optional)
   * @returns Promise<ZKPProof>
   */
  public async generateLicenseProof(licenseNumber: string, agencyId: string, agencyAddress?: string): Promise<ZKPProof> {
    try {
      console.log(`🔐 Generating ZKP proof for license: ${licenseNumber}`);

      // Check if circuit files exist
      if (!fs.existsSync(this.circuitWasmPath) || !fs.existsSync(this.circuitZkeyPath)) {
        throw new Error('ZKP circuit files not found. Run: node scripts/setup-zkp-circuit.js');
      }

      // Get valid licenses from database (this would be the public input)
      const validLicenses = await this.getValidLicenses();
      
      if (validLicenses.length === 0) {
        throw new Error('No valid licenses found in database');
      }

      // Pad the valid licenses array to exactly 10 elements (as expected by circuit)
      const paddedLicenses = [...validLicenses];
      while (paddedLicenses.length < 10) {
        paddedLicenses.push('0'); // Pad with zeros
      }

      // Convert license strings to numbers for the circuit
      const licenseToNumber = (license: string): string => {
        if (license === '0') return '0';
        // Convert license string to a number by hashing or simple conversion
        // For demo purposes, extract numbers from license string
        const match = license.match(/\d+/);
        return match ? match[0] : '0';
      };

      // Prepare circuit inputs
      const circuitInputs = {
        licenseNumber: licenseToNumber(licenseNumber),
        validLicenses: paddedLicenses.slice(0, 10).map(licenseToNumber) // Take only first 10 and convert
      };

      console.log('🔧 Circuit inputs prepared:', {
        licenseNumber: circuitInputs.licenseNumber,
        validLicensesCount: validLicenses.length,
        paddedLicensesCount: paddedLicenses.length
      });

      // Generate the proof using snarkjs
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        this.circuitWasmPath,
        this.circuitZkeyPath
      );

      console.log('✅ ZKP proof generated successfully');

      // Get agency address if not provided
      let finalAgencyAddress = agencyAddress;
      if (!finalAgencyAddress) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('blockchain_address')
          .eq('id', agencyId)
          .single();
        
        if (userError || !userData?.blockchain_address) {
          console.warn('Could not get agency address, using placeholder');
          finalAgencyAddress = 'unknown';
        } else {
          finalAgencyAddress = userData.blockchain_address;
        }
      }

      // Store the proof in database
      const { data: proofData, error: proofError } = await supabase
        .from('zkp_license_proofs')
        .insert({
          agency_id: agencyId,
          agency_address: finalAgencyAddress,
          license_number: licenseNumber,
          proof_data: JSON.stringify(proof),
          public_signals: JSON.stringify(publicSignals),
          merkle_root: 'simple_list', // For simple membership proof
          circuit_type: 'simple_membership',
          is_valid: true,
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
        })
        .select()
        .single();

      if (proofError) {
        console.error('Error storing proof:', proofError);
        throw proofError;
      }

      return {
        proof,
        publicSignals,
        proofId: proofData.id
      };

    } catch (error) {
      console.error('❌ Error generating ZKP proof:', error);
      throw error;
    }
  }

  /**
   * Verify a ZKP proof
   * @param proof - The proof object
   * @param publicSignals - The public signals
   * @returns Promise<boolean>
   */
  public async verifyLicenseProof(proof: any, publicSignals: any[]): Promise<boolean> {
    try {
      console.log('🔍 Verifying ZKP proof...');

      // Check if verification key exists
      if (!fs.existsSync(this.verificationKeyPath)) {
        throw new Error('Verification key not found. Run: node scripts/setup-zkp-circuit.js');
      }

      // Load verification key
      const verificationKey = JSON.parse(fs.readFileSync(this.verificationKeyPath, 'utf8'));

      // Verify the proof using snarkjs
      const isValid = await snarkjs.groth16.verify(
        verificationKey,
        publicSignals,
        proof
      );

      console.log('✅ ZKP proof verification result:', isValid);
      return isValid;

    } catch (error) {
      console.error('❌ Error verifying ZKP proof:', error);
      return false;
    }
  }

  /**
   * Create/update the list of valid licenses (this would be done by regulator)
   * @param licenseNumbers - Array of valid license numbers
   * @param regulatorId - The regulator's user ID (optional, for RLS compliance)
   * @returns Promise<void>
   */
  public async updateValidLicenses(licenseNumbers: string[], regulatorId?: string): Promise<void> {
    try {
      console.log(`📝 Updating valid licenses list with ${licenseNumbers.length} licenses`);

      // Clear existing valid licenses
      await supabase
        .from('zkp_merkle_trees')
        .delete()
        .eq('tree_name', 'valid_licenses');

      // Prepare insert data
      const insertData: any = {
        tree_name: 'valid_licenses',
        tree_data: { validLicenses: licenseNumbers },
        leaf_count: licenseNumbers.length,
        tree_height: Math.ceil(Math.log2(Math.max(licenseNumbers.length, 1))),
        is_current: true,
        merkle_root: 'simple_list' // Not using actual Merkle tree for simple circuit
      };

      // Add regulator ID if provided (for RLS compliance)
      if (regulatorId) {
        insertData.created_by = regulatorId;
      }

      // Store new valid licenses
      const { error } = await supabase
        .from('zkp_merkle_trees')
        .insert(insertData);

      if (error) {
        throw error;
      }

      console.log('✅ Valid licenses updated successfully');

    } catch (error) {
      console.error('❌ Error updating valid licenses:', error);
      throw error;
    }
  }

  /**
   * Get the current list of valid licenses
   * @returns Promise<string[]>
   */
  public async getValidLicenses(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('zkp_merkle_trees')
        .select('tree_data')
        .eq('tree_name', 'valid_licenses')
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        console.log('No valid licenses found, returning empty array');
        return [];
      }

      return data.tree_data.validLicenses || [];

    } catch (error) {
      console.error('Error getting valid licenses:', error);
      return [];
    }
  }

  /**
   * Get agency's ZKP proofs
   * @param agencyId - The agency's database ID
   * @returns Promise<any[]>
   */
  public async getAgencyProofs(agencyId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('zkp_license_proofs')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];

    } catch (error) {
      console.error('Error getting agency proofs:', error);
      return [];
    }
  }

  /**
   * Validate a proof exists and is valid
   * @param proofId - The proof ID
   * @returns Promise<boolean>
   */
  public async validateProofExists(proofId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('zkp_license_proofs')
        .select('is_valid')
        .eq('id', proofId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.is_valid;

    } catch (error) {
      console.error('Error validating proof existence:', error);
      return false;
    }
  }

  /**
   * Initialize the ZKP system with sample data
   * @param regulatorId - The regulator's user ID (optional, for RLS compliance)
   * @returns Promise<void>
   */
  public async initializeSystem(regulatorId?: string): Promise<void> {
    try {
      console.log('🚀 Initializing ZKP system with sample data...');

      // Sample valid licenses (these would come from the regulator)
      const sampleLicenses = [
        'LICENSE001',
        'LICENSE002', 
        'LICENSE003',
        'LICENSE004',
        'LICENSE005'
      ];

      await this.updateValidLicenses(sampleLicenses, regulatorId);
      console.log('✅ ZKP system initialized successfully');

    } catch (error) {
      console.error('❌ Error initializing ZKP system:', error);
      throw error;
    }
  }

  /**
   * Check if ZKP system is ready
   * @returns Promise<boolean>
   */
  public async isSystemReady(): Promise<boolean> {
    try {
      // Check if circuit files exist
      const filesExist = fs.existsSync(this.circuitWasmPath) && 
                        fs.existsSync(this.circuitZkeyPath) && 
                        fs.existsSync(this.verificationKeyPath);

      if (!filesExist) {
        return false;
      }

      // Check if valid licenses are configured
      const validLicenses = await this.getValidLicenses();
      return validLicenses.length > 0;

    } catch (error) {
      console.error('Error checking system readiness:', error);
      return false;
    }
  }
}

// Create singleton instance
export const zkpService = new ZKPService();

export default ZKPService;
