"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../config/supabase");
const environment_1 = require("../config/environment");
const identityService_1 = require("../services/identityService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Validation helper
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required: name, email, password, role' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (!['Worker', 'AgencyAdmin', 'Regulator'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be Worker, AgencyAdmin, or Regulator' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }
        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase_1.supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
        // Create DID using Veramo
        let did, privateKeyHex;
        try {
            const didResult = await (0, identityService_1.createUserDID)();
            did = didResult.did;
            privateKeyHex = didResult.privateKeyHex;
        }
        catch (didError) {
            console.error('DID creation error:', didError);
            return res.status(500).json({
                error: 'Failed to create decentralized identity. Please ensure Besu node is running.',
                details: process.env.NODE_ENV === 'development' ? didError?.message : undefined
            });
        }
        // Encrypt private key
        let encryptedPrivateKeyHex;
        try {
            encryptedPrivateKeyHex = (0, identityService_1.encryptPrivateKey)(privateKeyHex);
        }
        catch (encryptError) {
            console.error('Private key encryption error:', encryptError);
            return res.status(500).json({
                error: 'Failed to encrypt private key',
                details: process.env.NODE_ENV === 'development' ? encryptError?.message : undefined
            });
        }
        // Create user in database
        const userData = {
            email,
            password_hash: passwordHash,
            name,
            role,
            did,
            encrypted_private_key_hex: encryptedPrivateKeyHex,
        };
        const { data: newUser, error: insertError } = await supabase_1.supabase
            .from('users')
            .insert([userData])
            .select('id, email, name, role, did, created_at')
            .single();
        if (insertError) {
            console.error('Database insert error:', insertError);
            return res.status(500).json({
                error: 'Failed to create user in database',
                details: process.env.NODE_ENV === 'development' ? insertError.message : undefined,
                hint: 'Please ensure the users table exists in Supabase'
            });
        }
        // Return user profile (without sensitive data)
        const userProfile = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            did: newUser.did,
            created_at: newUser.created_at,
        };
        res.status(201).json({
            message: 'User created successfully',
            user: userProfile,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Find user by email
        const { data: user, error: findError } = await supabase_1.supabase
            .from('users')
            .select('id, email, password_hash, name, role, did, worker_address, agency_address')
            .eq('email', email)
            .single();
        if (findError || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Verify password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Generate JWT
        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            did: user.did,
        };
        const token = jsonwebtoken_1.default.sign(tokenPayload, environment_1.config.jwtSecret, { expiresIn: '24h' });
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                did: user.did,
                worker_address: user.worker_address,
                agency_address: user.agency_address,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});
// GET /api/auth/me (Protected route)
router.get('/me', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        // Fetch full user profile from database
        const { data: user, error } = await supabase_1.supabase
            .from('users')
            .select('id, email, name, role, did, worker_address, agency_address, created_at')
            .eq('id', req.user.id)
            .single();
        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userProfile = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            did: user.did,
            worker_address: user.worker_address,
            agency_address: user.agency_address,
            created_at: user.created_at,
        };
        res.status(200).json({
            user: userProfile,
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
