pragma circom 2.0.0;

// Simple hash function using basic arithmetic (for demonstration)
template SimpleHash() {
    signal input in;
    signal output out;
    
    // Simple hash: out = in * in + in + 1
    out <== in * in + in + 1;
}

// Template for verifying membership in a simple set
template SimpleMembershipProof(n) {
    signal input licenseNumber;
    signal input validLicenses[n];
    signal output valid;

    // Check if licenseNumber matches any of the valid licenses
    component isEqual[n];
    signal matches[n];
    
    for (var i = 0; i < n; i++) {
        isEqual[i] = IsEqual();
        isEqual[i].in[0] <== licenseNumber;
        isEqual[i].in[1] <== validLicenses[i];
        matches[i] <== isEqual[i].out;
    }
    
    // Sum all matches - should be 1 if valid, 0 if invalid
    signal sum[n];
    sum[0] <== matches[0];
    for (var i = 1; i < n; i++) {
        sum[i] <== sum[i-1] + matches[i];
    }
    
    valid <== sum[n-1];
}

// IsEqual template
template IsEqual() {
    signal input in[2];
    signal output out;

    component isz = IsZero();
    isz.in <== in[1] - in[0];
    out <== isz.out;
}

// IsZero template
template IsZero() {
    signal input in;
    signal output out;

    signal inv;
    inv <-- in != 0 ? 1/in : 0;
    out <== -in*inv + 1;
    in*out === 0;
}

// Main circuit for license verification (supports up to 10 valid licenses)
template LicenseVerifier() {
    // Private input (known only to the prover)
    signal input licenseNumber;
    
    // Public inputs (known to both prover and verifier)
    signal input validLicenses[10];
    
    // Output signal (1 if valid, 0 if invalid)
    signal output valid;

    // Verify membership
    component membershipProof = SimpleMembershipProof(10);
    membershipProof.licenseNumber <== licenseNumber;
    
    for (var i = 0; i < 10; i++) {
        membershipProof.validLicenses[i] <== validLicenses[i];
    }
    
    valid <== membershipProof.valid;
}

// Instantiate the main component
component main {public [validLicenses]} = LicenseVerifier();
