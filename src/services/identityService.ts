import { createAgent, IDIDManager, IKeyManager, IDataStore, IDataStoreORM, ICredentialIssuer, IResolver } from '@veramo/core';
import { DIDManager } from '@veramo/did-manager';
import { EthrDIDProvider } from '@veramo/did-provider-ethr';
import { KeyManager } from '@veramo/key-manager';
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';
import { DataStore, DataStoreORM, KeyStore, DIDStore, PrivateKeyStore } from '@veramo/data-store';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Resolver } from 'did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';
import { DataSource } from 'typeorm';
import { config } from '../config/environment';
import * as crypto from 'crypto';

// Database file for Veramo's internal state
const DATABASE_FILE = './veramo-data.sqlite';

// Create the Veramo agent
export const createVeramoAgent = async () => {
  // Create database connection for Veramo
  const dbConnection = new DataSource({
    type: 'sqlite',
    database: DATABASE_FILE,
    synchronize: true,
    logging: false,
    entities: require('@veramo/data-store').Entities,
  });

  await dbConnection.initialize();

  // Create DID resolver
  const didResolver = new Resolver({
    ...ethrDidResolver({
      networks: [
        {
          name: 'besu',
          rpcUrl: config.besu.rpcUrl,
          registry: '0x9a3DBCa554e9f6b9257aAa24010DA8377C57c17e', // Deployed ERC-1056 registry
        },
      ],
    }),
  });

  // Create the agent
  const agent = createAgent<IDIDManager & IKeyManager & IDataStore & IDataStoreORM & ICredentialIssuer & IResolver>({
    plugins: [
      new KeyManager({
        store: new KeyStore(dbConnection),
        kms: {
          local: new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(config.masterKey))),
        },
      }),
      new DIDManager({
        store: new DIDStore(dbConnection),
        defaultProvider: 'did:ethr:besu',
        providers: {
          'did:ethr:besu': new EthrDIDProvider({
            defaultKms: 'local',
            network: 'besu',
            rpcUrl: config.besu.rpcUrl,
            gas: 1000001,
            ttl: 60 * 60 * 24 * 30 * 12, // 1 year
          }),
        },
      }),
      new DIDResolverPlugin({
        resolver: didResolver,
      }),
      new DataStore(dbConnection),
      new DataStoreORM(dbConnection),
      new CredentialPlugin(),
    ],
  });

  return agent;
};

// Initialize the agent
let agent: any = null;

export const getAgent = async () => {
  if (!agent) {
    agent = await createVeramoAgent();
  }
  return agent;
};

// Create a new DID for a user
export const createUserDID = async (): Promise<{ did: string; privateKeyHex: string }> => {
  const veramoAgent = await getAgent();
  
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

// Encrypt private key with master key
export const encryptPrivateKey = (privateKeyHex: string): string => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(config.masterKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(privateKeyHex, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

// Decrypt private key with master key
export const decryptPrivateKey = (encryptedPrivateKeyHex: string): string => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(config.masterKey, 'salt', 32);
  
  const parts = encryptedPrivateKeyHex.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
