"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const zkpService_1 = require("../services/zkpService");
const router = express_1.default.Router();
/**
 * POST /api/zkp/generate-license-proof
 * Generate a ZKP proof for license verification (Agency only)
 */
router.post('/generate-license-proof', auth_1.authenticateToken, async (req, res) => {
    try {
        // Check if user is an agency admin
        if (req.user?.role !== 'AgencyAdmin') {
            return res.status(403).json({
                error: 'Only agency administrators can generate license proofs'
            });
        }
        const { license_number } = req.body;
        if (!license_number) {
            return res.status(400).json({
                error: 'license_number is required'
            });
        }
        // Validate license number format (basic validation)
        if (typeof license_number !== 'string' || license_number.length < 5) {
            return res.status(400).json({
                error: 'Invalid license number format'
            });
        }
        // Generate the ZKP proof using simplified service
        const result = await zkpService_1.zkpService.generateLicenseProof(license_number, req.user.id);
        res.json({
            message: 'License proof generated successfully',
            proof: result.proof,
            publicSignals: result.publicSignals,
            proofId: result.proofId,
            agency_id: req.user.id,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error generating license proof:', error);
        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes('No valid licenses found')) {
                return res.status(404).json({
                    error: 'No valid license registry found',
                    message: 'Please contact the regulator to update the license registry'
                });
            }
            if (error.message.includes('circuit files not found')) {
                return res.status(500).json({
                    error: 'ZKP system not initialized',
                    message: 'Please run the ZKP circuit setup'
                });
            }
        }
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/zkp/generate-agency-proof
 * Generate a ZKP proof for a specific agency (Regulator only)
 */
router.post('/generate-agency-proof', auth_1.authenticateToken, async (req, res) => {
    try {
        // Check if user is a regulator
        if (req.user?.role !== 'Regulator') {
            return res.status(403).json({
                error: 'Only regulators can generate proofs for agencies'
            });
        }

        const { agency_id, license_number } = req.body;

        if (!agency_id || !license_number) {
            return res.status(400).json({
                error: 'Both agency_id and license_number are required'
            });
        }

        // Validate license number format (basic validation)
        if (typeof license_number !== 'string' || license_number.length < 5) {
            return res.status(400).json({
                error: 'Invalid license number format'
            });
        }

        // Generate the ZKP proof using simplified service
        const result = await zkpService_1.zkpService.generateLicenseProofForAgency(license_number, agency_id, req.user.id);

        res.json({
            message: 'License proof generated successfully for agency',
            proof: result.proof,
            publicSignals: result.publicSignals,
            proofId: result.proofId,
            agency_id: agency_id,
            generated_by_regulator: req.user.id,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating agency proof:', error);
        
        // Handle specific error cases
        if (error instanceof Error) {
            if (error.message.includes('No valid licenses found')) {
                return res.status(404).json({
                    error: 'No valid license registry found',
                    message: 'Please update the license registry first'
                });
            }
            
            if (error.message.includes('circuit files not found')) {
                return res.status(500).json({
                    error: 'ZKP system not initialized',
                    message: 'Please run the ZKP circuit setup'
                });
            }

            if (error.message.includes('Agency not found')) {
                return res.status(404).json({
                    error: 'Agency not found',
                    message: 'The specified agency does not exist'
                });
            }
        }

        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/zkp/verify-license-proof
 * Verify a ZKP proof (Public endpoint)
 */
router.post('/verify-license-proof', async (req, res) => {
    try {
        const { proof, publicSignals } = req.body;
        if (!proof || !publicSignals) {
            return res.status(400).json({
                error: 'Both proof and publicSignals are required'
            });
        }
        // Validate proof structure
        if (!proof.pi_a || !proof.pi_b || !proof.pi_c) {
            return res.status(400).json({
                error: 'Invalid proof format'
            });
        }
        // Validate public signals
        if (!Array.isArray(publicSignals)) {
            return res.status(400).json({
                error: 'publicSignals must be an array'
            });
        }
        const isValid = await zkpService_1.zkpService.verifyLicenseProof(proof, publicSignals);
        res.json({
            isValid,
            message: isValid ? 'Proof is valid' : 'Proof is invalid',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error verifying license proof:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/zkp/my-proofs
 * Get agency's ZKP proofs (Agency only)
 */
router.get('/my-proofs', auth_1.authenticateToken, async (req, res) => {
    try {
        // Check if user is an agency admin
        if (req.user?.role !== 'AgencyAdmin') {
            return res.status(403).json({
                error: 'Only agency administrators can view their proofs'
            });
        }
        const agencyId = req.user.id;
        const proofs = await zkpService_1.zkpService.getAgencyProofs(agencyId);
        // Remove sensitive data from response
        const sanitizedProofs = proofs.map(proof => ({
            id: proof.id,
            circuit_type: proof.circuit_type,
            is_valid: proof.is_valid,
            verified_at: proof.verified_at,
            expires_at: proof.expires_at,
            created_at: proof.created_at
            // Note: proof_data and public_signals are excluded for security
        }));
        res.json({
            proofs: sanitizedProofs,
            count: sanitizedProofs.length,
            agency_id: agencyId,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error getting agency proofs:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/zkp/generated-proofs
 * Get all generated proofs (Regulator only)
 */
router.get('/generated-proofs', auth_1.authenticateToken, async (req, res) => {
    try {
        // Check if user is a regulator
        if (req.user?.role !== 'Regulator') {
            return res.status(403).json({
                error: 'Only regulators can view all generated proofs'
            });
        }

        const proofs = await zkpService_1.zkpService.getAllGeneratedProofs();
        
        res.json({
            proofs: proofs,
            count: proofs.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error getting generated proofs:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/zkp/update-valid-licenses
 * Update the list of valid licenses (Regulator only)
 */
router.post('/update-valid-licenses', auth_1.authenticateToken, async (req, res) => {
    try {
        // Check if user is a regulator
        if (req.user?.role !== 'Regulator') {
            return res.status(403).json({
                error: 'Only regulators can update valid licenses'
            });
        }
        const { license_numbers } = req.body;
        if (!license_numbers || !Array.isArray(license_numbers)) {
            return res.status(400).json({
                error: 'license_numbers array is required'
            });
        }
        if (license_numbers.length === 0) {
            return res.status(400).json({
                error: 'At least one license number is required'
            });
        }
        // Validate license numbers
        for (const license of license_numbers) {
            if (typeof license !== 'string' || license.length < 5) {
                return res.status(400).json({
                    error: 'All license numbers must be valid strings'
                });
            }
        }
        await zkpService_1.zkpService.updateValidLicenses(license_numbers, req.user.id);
        res.json({
            message: 'Valid licenses updated successfully',
            license_count: license_numbers.length,
            updated_by: req.user.id,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error updating valid licenses:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/zkp/valid-licenses
 * Get the current list of valid licenses (Public endpoint - for transparency)
 */
router.get('/valid-licenses', async (req, res) => {
    try {
        const validLicenses = await zkpService_1.zkpService.getValidLicenses();
        res.json({
            valid_licenses: validLicenses,
            count: validLicenses.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error getting valid licenses:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/zkp/proof/:proofId/validate
 * Validate that a proof exists and is valid (Public endpoint)
 */
router.get('/proof/:proofId/validate', async (req, res) => {
    try {
        const { proofId } = req.params;
        if (!proofId) {
            return res.status(400).json({
                error: 'Proof ID is required'
            });
        }
        const isValid = await zkpService_1.zkpService.validateProofExists(proofId);
        res.json({
            proof_id: proofId,
            exists: isValid,
            is_valid: isValid,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error validating proof:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/zkp/verify-license-by-proof-id/:proofId
 * Verify agency license using proof ID (Worker endpoint)
 */
router.get('/verify-license-by-proof-id/:proofId', auth_1.authenticateToken, async (req, res) => {
    try {
        // Check if user is a worker
        if (req.user?.role !== 'Worker') {
            return res.status(403).json({
                error: 'Only workers can verify agency licenses'
            });
        }

        const { proofId } = req.params;
        if (!proofId) {
            return res.status(400).json({
                error: 'Proof ID is required'
            });
        }

        // Get proof details and verify
        const verificationResult = await zkpService_1.zkpService.verifyLicenseByProofId(proofId);
        
        if (!verificationResult.exists) {
            return res.status(404).json({
                error: 'Proof not found',
                proof_id: proofId
            });
        }

        res.json({
            proof_id: proofId,
            is_valid: verificationResult.isValid,
            agency_info: verificationResult.agencyInfo,
            verification_details: {
                verified_at: verificationResult.verifiedAt,
                expires_at: verificationResult.expiresAt,
                circuit_type: verificationResult.circuitType
            },
            message: verificationResult.isValid ? 
                'Agency license is valid and verified' : 
                'Agency license verification failed',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error verifying license by proof ID:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/zkp/verify-license-by-proof-id
 * Alternative POST endpoint for verifying license by proof ID (Worker endpoint)
 */
router.post('/verify-license-by-proof-id', auth_1.authenticateToken, async (req, res) => {
    try {
        // Check if user is a worker
        if (req.user?.role !== 'Worker') {
            return res.status(403).json({
                error: 'Only workers can verify agency licenses'
            });
        }

        const { proofId } = req.body;
        if (!proofId) {
            return res.status(400).json({
                error: 'proofId is required in request body'
            });
        }

        // Get proof details and verify
        const verificationResult = await zkpService_1.zkpService.verifyLicenseByProofId(proofId);
        
        if (!verificationResult.exists) {
            return res.status(404).json({
                error: 'Proof not found',
                proof_id: proofId
            });
        }

        res.json({
            proof_id: proofId,
            is_valid: verificationResult.isValid,
            agency_info: verificationResult.agencyInfo,
            verification_details: {
                verified_at: verificationResult.verifiedAt,
                expires_at: verificationResult.expiresAt,
                circuit_type: verificationResult.circuitType
            },
            message: verificationResult.isValid ? 
                'Agency license is valid and verified' : 
                'Agency license verification failed',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error verifying license by proof ID:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/zkp/initialize
 * Initialize the ZKP system with sample data (Development only)
 */
router.post('/initialize', auth_1.authenticateToken, async (req, res) => {
    try {
        // Check if user is a regulator
        if (req.user?.role !== 'Regulator') {
            return res.status(403).json({
                error: 'Only regulators can initialize the ZKP system'
            });
        }
        await zkpService_1.zkpService.initializeSystem(req.user.id);
        res.json({
            message: 'ZKP system initialized successfully',
            initialized_by: req.user.id,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error initializing ZKP system:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/zkp/system-status
 * Check if the ZKP system is ready (Public endpoint)
 */
router.get('/system-status', async (req, res) => {
    try {
        const isReady = await zkpService_1.zkpService.isSystemReady();
        res.json({
            system_ready: isReady,
            message: isReady ? 'ZKP system is ready' : 'ZKP system needs initialization',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error checking system status:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
