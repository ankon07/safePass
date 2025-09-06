const { zkpService } = require('./src/services/zkpService');
const { supabase } = require('./src/config/supabase');

async function testZKPDirect() {
    console.log('🔐 Testing ZKP Service Directly...\n');

    try {
        // Step 1: Get test users
        console.log('1. Getting test users...');
        
        const { data: regulator, error: regulatorError } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('role', 'Regulator')
            .limit(1)
            .single();

        const { data: agency, error: agencyError } = await supabase
            .from('users')
            .select('id, name, email, role, blockchain_address')
            .eq('role', 'AgencyAdmin')
            .limit(1)
            .single();

        if (regulatorError || agencyError) {
            console.error('❌ Error getting test users:', { regulatorError, agencyError });
            return;
        }

        console.log('✅ Test users found:');
        console.log(`   🏛️  Regulator: ${regulator.name} (${regulator.id})`);
        console.log(`   🏢 Agency: ${agency.name} (${agency.id}, ${agency.blockchain_address})`);

        // Step 2: Check valid licenses
        console.log('\n2. Getting valid licenses...');
        const validLicenses = await zkpService.getValidLicenses();
        console.log('Valid licenses:', validLicenses);

        if (validLicenses.length === 0) {
            console.error('❌ No valid licenses found');
            return;
        }

        // Step 3: Test license number conversion
        console.log('\n3. Testing license number conversion...');
        const testLicense = validLicenses[0]; // Use first valid license
        console.log(`Testing with license: ${testLicense}`);

        // Test the conversion function directly
        const licenseToNumber = (license) => {
            if (license === '0' || license === 0)
                return '0';
            
            // If it's already a number, return as string
            if (typeof license === 'number') {
                return license.toString();
            }
            
            // Convert license string to a consistent number
            if (typeof license === 'string') {
                // Extract numbers from license string (e.g., "LIC2100411" -> "2100411")
                const match = license.match(/\d+/);
                if (match && match[0]) {
                    // Ensure the number is within a reasonable range for the circuit
                    const num = parseInt(match[0]);
                    return num.toString();
                }
            }
            
            // Fallback: convert string to a hash-like number
            let hash = 0;
            const str = license.toString();
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString();
        };

        const convertedLicense = licenseToNumber(testLicense);
        console.log(`Converted license: ${testLicense} -> ${convertedLicense}`);

        // Convert all valid licenses
        const convertedValidLicenses = validLicenses.map(licenseToNumber);
        console.log('All converted licenses:', convertedValidLicenses);

        // Step 4: Test circuit inputs preparation
        console.log('\n4. Preparing circuit inputs...');
        
        // Pad the valid licenses array to exactly 10 elements
        const paddedLicenses = [...validLicenses];
        while (paddedLicenses.length < 10) {
            paddedLicenses.push('0');
        }

        const circuitInputs = {
            licenseNumber: convertedLicense,
            validLicenses: paddedLicenses.slice(0, 10).map(licenseToNumber)
        };

        console.log('Circuit inputs:', {
            licenseNumber: circuitInputs.licenseNumber,
            validLicenses: circuitInputs.validLicenses,
            licenseNumberType: typeof circuitInputs.licenseNumber,
            validLicensesTypes: circuitInputs.validLicenses.map(l => typeof l)
        });

        // Step 5: Check if circuit files exist
        console.log('\n5. Checking circuit files...');
        const fs = require('fs');
        const path = require('path');
        
        const circuitWasmPath = path.join(process.cwd(), 'zkp/build/licenseVerifier_js/licenseVerifier.wasm');
        const circuitZkeyPath = path.join(process.cwd(), 'zkp/keys/licenseVerifier_0000.zkey');
        const verificationKeyPath = path.join(process.cwd(), 'zkp/build/verification_key.json');

        console.log('Circuit files check:');
        console.log(`  WASM: ${fs.existsSync(circuitWasmPath) ? '✅' : '❌'} ${circuitWasmPath}`);
        console.log(`  ZKEY: ${fs.existsSync(circuitZkeyPath) ? '✅' : '❌'} ${circuitZkeyPath}`);
        console.log(`  VKEY: ${fs.existsSync(verificationKeyPath) ? '✅' : '❌'} ${verificationKeyPath}`);

        if (!fs.existsSync(circuitWasmPath) || !fs.existsSync(circuitZkeyPath)) {
            console.error('❌ Circuit files missing');
            return;
        }

        // Step 6: Try to generate proof directly
        console.log('\n6. Attempting to generate ZKP proof...');
        
        try {
            const result = await zkpService.generateLicenseProofForAgency(
                testLicense,
                agency.id,
                regulator.id
            );
            
            console.log('✅ ZKP proof generated successfully!');
            console.log('Proof result:', {
                proofId: result.proofId,
                agencyInfo: result.agencyInfo,
                generatedBy: result.generatedBy
            });

        } catch (zkpError) {
            console.error('❌ ZKP proof generation failed:', zkpError);
            console.error('Error details:', {
                message: zkpError.message,
                stack: zkpError.stack
            });
        }

    } catch (error) {
        console.error('❌ Error during direct ZKP test:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
    }
}

// Run the test
testZKPDirect();
