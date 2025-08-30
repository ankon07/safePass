"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptPrivateKey = exports.encryptPrivateKey = exports.createUserDID = exports.getAgent = exports.createVeramoAgent = void 0;
const core_1 = require("@veramo/core");
const did_manager_1 = require("@veramo/did-manager");
const did_provider_ethr_1 = require("@veramo/did-provider-ethr");
const key_manager_1 = require("@veramo/key-manager");
const kms_local_1 = require("@veramo/kms-local");
const data_store_1 = require("@veramo/data-store");
const credential_w3c_1 = require("@veramo/credential-w3c");
const did_resolver_1 = require("@veramo/did-resolver");
const did_resolver_2 = require("did-resolver");
const ethr_did_resolver_1 = require("ethr-did-resolver");
const typeorm_1 = require("typeorm");
const environment_1 = require("../config/environment");
const crypto = __importStar(require("crypto"));
// Database file for Veramo's internal state
const DATABASE_FILE = './veramo-data.sqlite';
// Create the Veramo agent
const createVeramoAgent = async () => {
    // Create database connection for Veramo
    const dbConnection = new typeorm_1.DataSource({
        type: 'sqlite',
        database: DATABASE_FILE,
        synchronize: true,
        logging: false,
        entities: require('@veramo/data-store').Entities,
    });
    await dbConnection.initialize();
    // Create DID resolver
    const didResolver = new did_resolver_2.Resolver({
        ...(0, ethr_did_resolver_1.getResolver)({
            networks: [
                {
                    name: 'besu',
                    rpcUrl: environment_1.config.besu.rpcUrl,
                    registry: '0x9a3DBCa554e9f6b9257aAa24010DA8377C57c17e', // Deployed ERC-1056 registry
                },
            ],
        }),
    });
    // Create the agent
    const agent = (0, core_1.createAgent)({
        plugins: [
            new key_manager_1.KeyManager({
                store: new data_store_1.KeyStore(dbConnection),
                kms: {
                    local: new kms_local_1.KeyManagementSystem(new data_store_1.PrivateKeyStore(dbConnection, new kms_local_1.SecretBox(environment_1.config.masterKey))),
                },
            }),
            new did_manager_1.DIDManager({
                store: new data_store_1.DIDStore(dbConnection),
                defaultProvider: 'did:ethr:besu',
                providers: {
                    'did:ethr:besu': new did_provider_ethr_1.EthrDIDProvider({
                        defaultKms: 'local',
                        network: 'besu',
                        rpcUrl: environment_1.config.besu.rpcUrl,
                        gas: 1000001,
                        ttl: 60 * 60 * 24 * 30 * 12, // 1 year
                    }),
                },
            }),
            new did_resolver_1.DIDResolverPlugin({
                resolver: didResolver,
            }),
            new data_store_1.DataStore(dbConnection),
            new data_store_1.DataStoreORM(dbConnection),
            new credential_w3c_1.CredentialPlugin(),
        ],
    });
    return agent;
};
exports.createVeramoAgent = createVeramoAgent;
// Initialize the agent
let agent = null;
const getAgent = async () => {
    if (!agent) {
        agent = await (0, exports.createVeramoAgent)();
    }
    return agent;
};
exports.getAgent = getAgent;
// Create a new DID for a user
const createUserDID = async () => {
    const veramoAgent = await (0, exports.getAgent)();
    // Generate a random private key
    const privateKeyHex = crypto.randomBytes(32).toString('hex');
    // Import the key into Veramo's key manager
    const key = await veramoAgent.keyManagerImport({
        kms: 'local',
        type: 'Secp256k1',
        privateKeyHex: privateKeyHex,
    });
    console.log('Imported key:', key);
    // Create a DID using the imported key
    const identifier = await veramoAgent.didManagerCreate({
        provider: 'did:ethr:besu',
        kms: 'local',
        options: {
            keyType: 'Secp256k1',
        },
    });
    console.log('Created identifier:', identifier);
    return {
        did: identifier.did,
        privateKeyHex: privateKeyHex,
    };
};
exports.createUserDID = createUserDID;
// Encrypt private key with master key
const encryptPrivateKey = (privateKeyHex) => {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(environment_1.config.masterKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKeyHex, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};
exports.encryptPrivateKey = encryptPrivateKey;
// Decrypt private key with master key
const decryptPrivateKey = (encryptedPrivateKeyHex) => {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(environment_1.config.masterKey, 'salt', 32);
    const parts = encryptedPrivateKeyHex.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decryptPrivateKey = decryptPrivateKey;
