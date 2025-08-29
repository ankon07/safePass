const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupZKPCircuit() {
  console.log('🔧 Setting up ZKP Circuit and Keys...');

  try {
    // Ensure directories exist
    const dirs = ['zkp/build', 'zkp/keys', 'zkp/ptau'];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    // Step 1: Compile the circuit
    console.log('\n📝 Step 1: Compiling Circom circuit...');
    const compileCmd = `circom zkp/circuits/licenseVerifier.circom --r1cs --wasm --sym -o zkp/build`;
    execSync(compileCmd, { stdio: 'inherit' });
    console.log('✅ Circuit compiled successfully');

    // Step 2: Download or generate Powers of Tau file
    console.log('\n🔢 Step 2: Setting up Powers of Tau...');
    const ptauFile = 'zkp/ptau/powersOfTau28_hez_final_15.ptau';
    
    if (!fs.existsSync(ptauFile)) {
      console.log('📥 Downloading Powers of Tau file (this may take a while)...');
      try {
        // Try to download the ceremony file
        const downloadCmd = `wget -O ${ptauFile} https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau`;
        execSync(downloadCmd, { stdio: 'inherit' });
        console.log('✅ Powers of Tau file downloaded');
      } catch (error) {
        console.log('⚠️  Download failed, generating local Powers of Tau...');
        // Generate a smaller local ceremony for testing
        const localPtau = 'zkp/ptau/pot15_0000.ptau';
        const genCmd = `snarkjs powersoftau new bn128 15 ${localPtau} -v`;
        execSync(genCmd, { stdio: 'inherit' });
        
        const contributeCmd = `snarkjs powersoftau contribute ${localPtau} zkp/ptau/pot15_0001.ptau --name="First contribution" -v -e="random text"`;
        execSync(contributeCmd, { stdio: 'inherit' });
        
        const finalizeCmd = `snarkjs powersoftau prepare phase2 zkp/ptau/pot15_0001.ptau ${ptauFile} -v`;
        execSync(finalizeCmd, { stdio: 'inherit' });
        
        console.log('✅ Local Powers of Tau generated');
      }
    } else {
      console.log('✅ Powers of Tau file already exists');
    }

    // Step 3: Generate proving key
    console.log('\n🔑 Step 3: Generating proving key...');
    const setupCmd = `snarkjs groth16 setup zkp/build/licenseVerifier.r1cs ${ptauFile} zkp/keys/licenseVerifier_0000.zkey`;
    execSync(setupCmd, { stdio: 'inherit' });
    console.log('✅ Proving key generated');

    // Step 4: Export verification key
    console.log('\n🔓 Step 4: Exporting verification key...');
    const exportCmd = `snarkjs zkey export verificationkey zkp/keys/licenseVerifier_0000.zkey zkp/build/verification_key.json`;
    execSync(exportCmd, { stdio: 'inherit' });
    console.log('✅ Verification key exported');

    // Step 5: Verify the setup
    console.log('\n✅ Step 5: Verifying setup...');
    const files = [
      'zkp/build/licenseVerifier.r1cs',
      'zkp/build/licenseVerifier_js/licenseVerifier.wasm',
      'zkp/keys/licenseVerifier_0000.zkey',
      'zkp/build/verification_key.json'
    ];

    let allFilesExist = true;
    files.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
      } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
      }
    });

    if (allFilesExist) {
      console.log('\n🎉 ZKP Circuit setup completed successfully!');
      console.log('📋 All necessary files have been generated:');
      console.log('   - Circuit compilation files (R1CS, WASM)');
      console.log('   - Proving key for generating proofs');
      console.log('   - Verification key for verifying proofs');
      console.log('\n🔄 You can now test the ZKP system with: npm run phase6:test');
    } else {
      console.log('\n❌ Setup incomplete - some files are missing');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error setting up ZKP circuit:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure Circom is installed: circom --version');
    console.log('2. Make sure SnarkJS is installed: npm list snarkjs');
    console.log('3. Check that the circuit file exists: zkp/circuits/licenseVerifier.circom');
    process.exit(1);
  }
}

// Run the setup
setupZKPCircuit();
