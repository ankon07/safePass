import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ApiError,
  DocumentUploadResponse,
  DocumentsResponse,
  DocumentType,
  CredentialsResponse,
  IssueCredentialRequest,
  IssueCredentialResponse,
  RejectDocumentRequest,
  TrustScore,
  TrustScoreStatistics,
  TopAgenciesResponse,
  GenerateLicenseProofRequest,
  GenerateLicenseProofResponse,
  VerifyLicenseProofRequest,
  VerifyLicenseProofResponse,
  AgencyZKPProofsResponse,
  UsersResponse,
  WorkersResponse,
  UserStatsResponse,
  BlockchainStatus,
  BlockchainCredential,
  WorkerCredentials,
  HealthResponse,
  Job,
  JobsResponse,
  JobApplication,
  JobApplicationsResponse,
  CreateJobRequest,
  ApplyJobRequest,
} from './api-types';

class SafePassAPIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.token = this.getStoredToken();
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('safepass_jwt_token');
    }
    return null;
  }

  private setStoredToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('safepass_jwt_token', token);
    }
    this.token = token;
  }

  private removeStoredToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('safepass_jwt_token');
    }
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { skipAuth?: boolean } = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists and not explicitly skipped
    if (this.token && !options.skipAuth) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401) {
          this.removeStoredToken();
          // Redirect to login if in browser
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        throw { status: response.status, ...data } as ApiError & { status: number };
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          error: 'Network error',
          message: 'Unable to connect to the server. Please check your connection.',
        } as ApiError;
      }
      throw error;
    }
  }

  // Authentication Methods
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await this.request<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    });
    return response;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });

    if (response.token) {
      this.setStoredToken(response.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  logout(): void {
    this.removeStoredToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Health Check
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health', {
      skipAuth: true,
    });
  }

  // User Management Methods
  async getAllUsers(): Promise<UsersResponse> {
    return this.request<UsersResponse>('/api/users');
  }

  async getAllWorkers(): Promise<WorkersResponse> {
    return this.request<WorkersResponse>('/api/users/workers');
  }

  async getUserById(id: string): Promise<{ user: User }> {
    return this.request<{ user: User }>(`/api/users/${id}`);
  }

  async getUserStats(): Promise<UserStatsResponse> {
    return this.request<UserStatsResponse>('/api/users/stats/overview');
  }

  // Document Management Methods
  async uploadDocument(file: File, documentType: DocumentType): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    return this.request<DocumentUploadResponse>('/api/worker/documents', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set it for FormData
        Authorization: this.token ? `Bearer ${this.token}` : '',
      },
    });
  }

  async getWorkerDocuments(): Promise<DocumentsResponse> {
    return this.request<DocumentsResponse>('/api/worker/documents');
  }

  async getPendingDocuments(): Promise<DocumentsResponse> {
    return this.request<DocumentsResponse>('/api/regulator/documents/pending');
  }

  async getVerifiedDocuments(): Promise<DocumentsResponse> {
    return this.request<DocumentsResponse>('/api/regulator/documents/verified');
  }

  // Credential Management Methods
  async getWorkerCredentials(): Promise<CredentialsResponse> {
    return this.request<CredentialsResponse>('/api/worker/me/credentials');
  }

  async issueCredential(request: IssueCredentialRequest): Promise<IssueCredentialResponse> {
    return this.request<IssueCredentialResponse>('/api/regulator/issue-credential', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async rejectDocument(request: RejectDocumentRequest): Promise<{ message: string; data: any }> {
    return this.request<{ message: string; data: any }>('/api/regulator/reject-document', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async verifyCredential(jwt: string): Promise<any> {
    return this.request<any>(`/api/credentials/verify/${jwt}`, {
      skipAuth: true,
    });
  }

  // Trust Score Methods
  async getAgencyTrustScore(address: string): Promise<TrustScore> {
    return this.request<TrustScore>(`/api/trust-scores/agencies/${address}`, {
      skipAuth: true,
    });
  }

  async getTrustScoreStatistics(): Promise<TrustScoreStatistics> {
    return this.request<TrustScoreStatistics>('/api/trust-scores/statistics', {
      skipAuth: true,
    });
  }

  async getTopAgencies(limit?: number): Promise<TopAgenciesResponse> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<TopAgenciesResponse>(`/api/trust-scores/top-agencies${params}`, {
      skipAuth: true,
    });
  }

  async calculateTrustScores(agencyAddress?: string): Promise<any> {
    const body = agencyAddress ? { agency_address: agencyAddress } : {};
    return this.request<any>('/api/trust-scores/calculate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async recordTrustScoreEvent(eventData: any): Promise<any> {
    return this.request<any>('/api/trust-scores/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getTrustScoreEvents(agencyAddress: string, limit?: number): Promise<any> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<any>(`/api/trust-scores/events/${agencyAddress}${params}`, {
      skipAuth: true,
    });
  }

  // ZKP Methods
  async generateLicenseProof(request: GenerateLicenseProofRequest): Promise<GenerateLicenseProofResponse> {
    return this.request<GenerateLicenseProofResponse>('/api/zkp/generate-license-proof', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async verifyLicenseProof(request: VerifyLicenseProofRequest): Promise<VerifyLicenseProofResponse> {
    return this.request<VerifyLicenseProofResponse>('/api/zkp/verify-license-proof', {
      method: 'POST',
      body: JSON.stringify(request),
      skipAuth: true,
    });
  }

  async getAgencyZKPProofs(): Promise<AgencyZKPProofsResponse> {
    return this.request<AgencyZKPProofsResponse>('/api/zkp/my-proofs');
  }

  async updateValidLicenses(licenseNumbers: string[]): Promise<any> {
    return this.request<any>('/api/zkp/update-valid-licenses', {
      method: 'POST',
      body: JSON.stringify({ license_numbers: licenseNumbers }),
    });
  }

  async getValidLicenses(): Promise<{ valid_licenses: string[]; count: number; timestamp: string }> {
    return this.request<{ valid_licenses: string[]; count: number; timestamp: string }>('/api/zkp/valid-licenses', {
      skipAuth: true,
    });
  }

  async validateProofExists(proofId: string): Promise<any> {
    return this.request<any>(`/api/zkp/proof/${proofId}/validate`, {
      skipAuth: true,
    });
  }

  async initializeZKPSystem(): Promise<any> {
    return this.request<any>('/api/zkp/initialize', {
      method: 'POST',
    });
  }

  async checkZKPSystemStatus(): Promise<any> {
    return this.request<any>('/api/zkp/system-status', {
      skipAuth: true,
    });
  }

  // Blockchain Methods
  async getBlockchainStatus(): Promise<BlockchainStatus> {
    return this.request<BlockchainStatus>('/api/blockchain/status', {
      skipAuth: true,
    });
  }

  async issueCredentialOnBlockchain(action: string): Promise<any> {
    return this.request<any>('/api/blockchain/credentials/issue', {
      method: 'POST',
      body: JSON.stringify({ action }),
      skipAuth: true,
    });
  }

  async updateCredentialStatus(credentialId: string, status: string): Promise<any> {
    return this.request<any>(`/api/blockchain/credentials/${credentialId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getCredentialInformation(credentialId: string): Promise<BlockchainCredential> {
    return this.request<BlockchainCredential>(`/api/blockchain/credentials/${credentialId}`, {
      skipAuth: true,
    });
  }

  async getWorkerCredentialsFromBlockchain(workerDid: string): Promise<WorkerCredentials> {
    return this.request<WorkerCredentials>(`/api/blockchain/workers/${workerDid}/credentials`, {
      skipAuth: true,
    });
  }

  async getContractEvents(contractName: string, eventName: string, fromBlock?: number, toBlock?: number): Promise<any> {
    const params = new URLSearchParams();
    if (fromBlock !== undefined) params.append('fromBlock', fromBlock.toString());
    if (toBlock !== undefined) params.append('toBlock', toBlock.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    return this.request<any>(`/api/blockchain/events/${contractName}/${eventName}${queryString}`, {
      skipAuth: true,
    });
  }

  async registerContract(name: string, address: string, abi: any[]): Promise<any> {
    return this.request<any>('/api/blockchain/contracts/register', {
      method: 'POST',
      body: JSON.stringify({ name, address, abi }),
    });
  }

  async deployContract(name: string, abi: any[], bytecode: string, constructorArgs: any[]): Promise<any> {
    return this.request<any>('/api/blockchain/contracts/deploy', {
      method: 'POST',
      body: JSON.stringify({ name, abi, bytecode, constructorArgs }),
    });
  }

  // Job Management Methods
  async getAllJobs(page?: number, limit?: number, country?: string, category?: string): Promise<JobsResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (country) params.append('country', country);
    if (category) params.append('category', category);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    return this.request<JobsResponse>(`/api/jobs${queryString}`, {
      skipAuth: true,
    });
  }

  async getJobById(id: string): Promise<{ message: string; data: Job }> {
    return this.request<{ message: string; data: Job }>(`/api/jobs/${id}`, {
      skipAuth: true,
    });
  }

  async createJob(jobData: CreateJobRequest): Promise<{ message: string; data: Job }> {
    return this.request<{ message: string; data: Job }>('/api/agency/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  }

  async updateJob(id: string, jobData: Partial<CreateJobRequest>): Promise<{ message: string; data: Job }> {
    return this.request<{ message: string; data: Job }>(`/api/agency/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  }

  async deleteJob(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/agency/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  async getAgencyJobs(): Promise<JobsResponse> {
    return this.request<JobsResponse>('/api/agency/jobs');
  }

  // Job Application Methods
  async applyForJob(applicationData: ApplyJobRequest): Promise<{ message: string; data: JobApplication }> {
    return this.request<{ message: string; data: JobApplication }>('/api/worker/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async getWorkerApplications(): Promise<JobApplicationsResponse> {
    return this.request<JobApplicationsResponse>('/api/worker/applications');
  }

  async getJobApplications(jobId: string): Promise<JobApplicationsResponse> {
    return this.request<JobApplicationsResponse>(`/api/agency/jobs/${jobId}/applications`);
  }

  async updateApplicationStatus(
    applicationId: string, 
    status: 'Reviewed' | 'Accepted' | 'Rejected',
    reviewerNotes?: string
  ): Promise<{ message: string; data: JobApplication }> {
    return this.request<{ message: string; data: JobApplication }>(`/api/agency/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewerNotes }),
    });
  }

  async getApplicationById(id: string): Promise<{ message: string; data: JobApplication }> {
    return this.request<{ message: string; data: JobApplication }>(`/api/applications/${id}`);
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Create and export a singleton instance
export const apiClient = new SafePassAPIClient();
export default apiClient;
