"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: process.env.PORT || 3001,
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    masterKey: process.env.MASTER_KEY || 'your-master-encryption-key-change-in-production',
    supabase: {
        url: process.env.SUPABASE_URL || 'https://oirxwprqvcqmnsxmrcyq.supabase.co',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
    },
    besu: {
        rpcUrl: process.env.BESU_RPC_URL || 'http://localhost:8545',
    },
};
