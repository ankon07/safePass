// API Types based on SafePass Backend API Documentation

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Worker' | 'AgencyAdmin' | 'Regulator';
  did: string;
  created_at: string;
  agency_address?: string; // Blockchain address for AgencyAdmin users
  worker_address?: string; // Blockchain address for Worker users
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'Worker' | 'AgencyAdmin' | 'Regulator';
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: string;
}

// Document Types
export type DocumentType = 
  | 'Passport' 
  | 'NID' 
  | 'TrainingCertificate' 
  | 'EducationCertificate' 
  | 'SkillsCertificate' 
  | 'WorkPermit';

export type DocumentStatus = 'PendingVerification' | 'Verified' | 'Rejected';

export interface Document {
  id: string;
  documentType: DocumentType;
  ipfsCid: string;
  status: DocumentStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  worker?: {
    id: string;
    name: string;
    email: string;
    did: string;
  };
}

export interface DocumentUploadResponse {
  message: string;
  data: Document;
}

export interface DocumentsResponse {
  message: string;
  data: Document[];
}

// Credential Types
export interface Credential {
  id: string;
  type: string;
  issuanceDate: string;
  issuerDid: string;
  jwt: string;
  sourceDocument?: {
    type: DocumentType;
    ipfsCid: string;
    uploadedAt: string;
  };
}

export interface CredentialsResponse {
  message: string;
  data: Credential[];
}

export interface IssueCredentialRequest {
  documentUploadId: string;
  holderDid: string;
  claims: Record<string, any>;
}

export interface IssueCredentialResponse {
  message: string;
  data: {
    credentialId: string;
    holderDid: string;
    issuerDid: string;
    type: string;
    issuanceDate: string;
    jwt: string;
  };
}

export interface RejectDocumentRequest {
  documentUploadId: string;
  reviewerNotes: string;
}

// Trust Score Types
export interface TrustScore {
  agency_address: string;
  trust_score: number;
  trust_score_display: string;
  timestamp: string;
  agency_name?: string;
}

export interface TrustScoreStatistics {
  total_agencies: number;
  average_score: string;
  min_score: string;
  max_score: string;
  median_score: string;
}

export interface TopAgenciesResponse {
  agencies: TrustScore[];
  count: number;
  timestamp: string;
}

// ZKP Types
export interface ZKPProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
}

export interface GenerateLicenseProofRequest {
  license_number: string;
}

export interface GenerateLicenseProofResponse {
  message: string;
  proof: ZKPProof;
  publicSignals: string[];
  proofId: string;
  agency_id: string;
  timestamp: string;
}

export interface VerifyLicenseProofRequest {
  proof: ZKPProof;
  publicSignals: string[];
}

export interface VerifyLicenseProofResponse {
  proof_id: string;
  is_valid: boolean;
  agency_info: {
    name: string;
    email: string;
    blockchain_address: string;
    license_verified: boolean;
  };
  verification_details: {
    verified_at: string;
    expires_at: string;
    circuit_type: string;
  };
  message: string;
  timestamp: string;
}

export interface AgencyZKPProof {
  id: string;
  circuit_type: string;
  is_valid: boolean;
  verified_at: string;
  expires_at: string;
  created_at: string;
}

export interface AgencyZKPProofsResponse {
  proofs: AgencyZKPProof[];
  count: number;
  agency_id: string;
  timestamp: string;
}

// User Management Types
export interface UsersResponse {
  users: User[];
  total: number;
}

export interface WorkersResponse {
  workers: User[];
  total: number;
}

export interface UserStatsResponse {
  totalUsers: number;
  roleBreakdown: {
    workers: number;
    agencyAdmins: number;
    regulators: number;
  };
  statistics: {
    Worker: number;
    AgencyAdmin: number;
    Regulator: number;
  };
}

// Blockchain Types
export interface BlockchainStatus {
  status: string;
  walletAddress: string;
  balance: string;
  currentBlock: number;
  registeredContracts: string[];
}

export interface BlockchainCredential {
  credentialId: string;
  status: string;
  issuer: string;
  holder: string;
  issuanceDate: string;
}

export interface WorkerCredentials {
  workerDid: string;
  credentials: Array<{
    id: string;
    type: string;
    status: string;
    issuanceDate: string;
  }>;
}

// Health Check
export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

// Job Types
export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  location: {
    country: string;
    city: string;
  };
  companyName: string;
  agencyId: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract';
  category: string;
  postedAt: string;
  expiresAt: string;
  status: 'Active' | 'Closed' | 'Draft';
  benefits: string[];
  workingHours: string;
  accommodationProvided: boolean;
  transportationProvided: boolean;
  visaSponsorship: boolean;
}

export interface JobsResponse {
  message: string;
  data: Job[];
  total: number;
  page: number;
  limit: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  workerId: string;
  status: 'Pending' | 'Reviewed' | 'Accepted' | 'Rejected';
  appliedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  job?: Job;
  worker?: User;
}

export interface JobApplicationsResponse {
  message: string;
  data: JobApplication[];
  total: number;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  requirements: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  location: {
    country: string;
    city: string;
  };
  jobType: 'Full-time' | 'Part-time' | 'Contract';
  category: string;
  expiresAt: string;
  benefits: string[];
  workingHours: string;
  accommodationProvided: boolean;
  transportationProvided: boolean;
  visaSponsorship: boolean;
}

export interface ApplyJobRequest {
  jobId: string;
  coverLetter?: string;
}

// Escrow Types
export interface EscrowDeposit {
  id: string;
  employment_contract_address: string;
  employer_address: string;
  worker_address: string;
  deposit_amount: number;
  transaction_hash: string;
  status: 'Active' | 'Released' | 'Disputed';
  created_at: string;
  updated_at?: string;
  release_reason?: string;
}

export interface EscrowStatistics {
  total_deposits: number;
  total_amount: number;
  active_deposits: number;
  active_amount: number;
  released_deposits: number;
  released_amount: number;
  disputed_deposits: number;
  disputed_amount: number;
}

export interface EscrowComplianceResult {
  compliant: string[];
  nonCompliant: string[];
}

// Contract Details Types
export interface ContractDetails {
  worker: string;
  employer: string;
  salary: string;
  payFrequency: string;
  nextPaymentDueDate: string;
  escrowRequirement: string;
  escrowDeposited: boolean;
  escrowContract: string;
  status: string;
  paymentStatus: string;
  workerSigned: boolean;
  employerSigned: boolean;
}

export interface ContractTestResult {
  paymentCount: string;
  isReadyForActivation: boolean;
  message: string;
}

// Blockchain Event Types
export interface BlockchainEvent {
  blockNumber: string;
  transactionHash: string;
  args: any;
  topics: string[];
}

export interface ContractEventsResponse {
  contractName: string;
  eventName: string;
  fromBlock: number | string;
  toBlock: number | string;
  events: BlockchainEvent[];
}

// Enhanced Blockchain Types
export interface BlockchainCredentialDetails {
  credentialId: string;
  status: string;
  issuer: string;
}

export interface DeployContractResponse {
  success: boolean;
  message: string;
  address: string;
  constructorArgs: any[];
}

export interface RegisterContractResponse {
  success: boolean;
  message: string;
  address: string;
}

// Merkle Verification Types
export interface MerkleProof {
  position: 'left' | 'right';
  data: string;
}

export interface MerkleProofResponse {
  success: boolean;
  data: {
    transactionHash: string;
    batchId: number;
    merkleRoot: string;
    proof: MerkleProof[];
    leafIndex: number;
    sepoliaContract: string;
    sepoliaTxHash: string;
    anchoredAt: string;
    verificationUrl: string;
  };
  message: string;
}

export interface MerkleVerifyRequest {
  transactionHash: string;
  proof: MerkleProof[];
  merkleRoot: string;
  batchId: number;
}

export interface MerkleVerifyResponse {
  success: boolean;
  verified: boolean;
  verification: {
    local: boolean;
    sepolia: boolean;
    sepoliaDetails: {
      verified: boolean;
      actualRoot: string;
      exists: boolean;
      contractAddress: string;
    };
  };
  transactionHash: string;
  batchId: number;
  merkleRoot: string;
  verifiedAt: string;
  etherscanUrl: string | null;
}

export interface AnchoringBatch {
  batch_id: number;
  merkle_root: string;
  transaction_count: number;
  anchored_at: string;
  sepolia_tx_hash: string;
  sepolia_block_number: number;
  besu_start_block?: number;
  besu_end_block?: number;
}

export interface BatchDetailsResponse {
  success: boolean;
  data: {
    batch: AnchoringBatch;
    transactions: Array<{
      transaction_hash: string;
      besu_block_number: number;
      transaction_index: number;
      leaf_index: number;
    }>;
    etherscanUrl: string;
  };
}

export interface BatchesResponse {
  success: boolean;
  data: {
    batches: AnchoringBatch[];
    pagination: {
      page: number;
      limit: number;
      totalBatches: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface AnchoringStatusResponse {
  success: boolean;
  status: {
    totalBatches: number;
    totalTransactions: number;
    lastAnchoredAt: string | null;
    latestBatch: AnchoringBatch | null;
    sepoliaContract: string;
    serviceStatus: {
      service_name: string;
      last_run_at: string | null;
      last_success_at: string | null;
      last_error_at: string | null;
      last_error_message: string | null;
      next_scheduled_run: string | null;
    } | null;
    lastUpdate: string;
  };
}

export interface VerificationStatsResponse {
  success: boolean;
  data: {
    overview: {
      totalBatches: number;
      totalTransactions: number;
      firstAnchorDate: string | null;
      lastAnchorDate: string | null;
      avgTransactionsPerBatch: number;
      maxTransactionsPerBatch: number;
    };
    recentActivity: Array<{
      date: string;
      batches: number;
      transactions: number;
    }>;
    sepoliaContract: string;
    generatedAt: string;
  };
}

export interface TransactionSearchResponse {
  success: boolean;
  data: {
    query: string;
    results: Array<{
      transaction_hash: string;
      batch_id: number;
      merkle_root: string;
      anchored_at: string;
      sepolia_tx_hash: string;
    }>;
    count: number;
  };
}

export interface TransactionValidationResponse {
  success: boolean;
  data: {
    transactionHash: string;
    isValid: boolean;
    format: 'valid' | 'invalid';
    requirements: {
      startsWithOx: boolean;
      correctLength: boolean;
      hexadecimal: boolean;
    };
  };
}

export interface AnchoringHealthResponse {
  success: boolean;
  data: {
    service: string;
    status: any;
    statistics: any;
    connectivity: {
      besu: boolean;
      sepolia: boolean;
    };
    configuration: any;
    isRunning: boolean;
    schedulerActive: boolean;
    timestamp: string;
  };
}

export interface ManualAnchoringResponse {
  success: boolean;
  message: string;
  triggeredBy: string;
  triggeredAt: string;
  note: string;
}

// Generic API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
