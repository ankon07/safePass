import axios from 'axios';
import FormData from 'form-data';

export interface IpfsUploadResult {
    cid: string;
    size: number;
}

export class SimpleIpfsService {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:5001') {
        this.baseUrl = baseUrl;
    }

    /**
     * Upload a file buffer to IPFS using direct HTTP API
     */
    async uploadFile(fileBuffer: Buffer, filename?: string): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('file', fileBuffer, filename || 'file');

            const response = await axios.post(`${this.baseUrl}/api/v0/add`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 30000, // 30 second timeout
            });

            if (response.data && response.data.Hash) {
                return response.data.Hash;
            } else {
                throw new Error('Invalid response from IPFS node');
            }
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('IPFS node is not running or not accessible');
            } else if (error.code === 'ETIMEDOUT') {
                throw new Error('IPFS upload timeout - node may be busy');
            } else {
                throw new Error(`IPFS upload failed: ${error.message}`);
            }
        }
    }

    /**
     * Retrieve a file from IPFS using direct HTTP API
     */
    async getFile(cid: string): Promise<Buffer> {
        try {
            const response = await axios.post(`${this.baseUrl}/api/v0/cat?arg=${cid}`, null, {
                responseType: 'arraybuffer',
                timeout: 30000,
            });

            return Buffer.from(response.data);
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('IPFS node is not running or not accessible');
            } else if (error.code === 'ETIMEDOUT') {
                throw new Error('IPFS retrieval timeout');
            } else {
                throw new Error(`IPFS retrieval failed: ${error.message}`);
            }
        }
    }

    /**
     * Pin a file in IPFS using direct HTTP API
     */
    async pinFile(cid: string): Promise<void> {
        try {
            await axios.post(`${this.baseUrl}/api/v0/pin/add?arg=${cid}`, null, {
                timeout: 30000,
            });
        } catch (error: any) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('IPFS node is not running or not accessible');
            } else if (error.code === 'ETIMEDOUT') {
                throw new Error('IPFS pin timeout');
            } else {
                throw new Error(`IPFS pin failed: ${error.message}`);
            }
        }
    }

    /**
     * Check if IPFS node is accessible
     */
    async checkConnection(): Promise<boolean> {
        try {
            const response = await axios.post(`${this.baseUrl}/api/v0/id`, null, {
                timeout: 5000,
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get IPFS node information
     */
    async getNodeInfo(): Promise<any> {
        try {
            const response = await axios.post(`${this.baseUrl}/api/v0/id`, null, {
                timeout: 10000,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Failed to get IPFS node info: ${error.message}`);
        }
    }
}

// Export a default instance
export const ipfsService = new SimpleIpfsService();
