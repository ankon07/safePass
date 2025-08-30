"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipfsService = exports.SimpleIpfsService = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
class SimpleIpfsService {
    constructor(baseUrl = 'http://localhost:5001') {
        this.baseUrl = baseUrl;
    }
    /**
     * Upload a file buffer to IPFS using direct HTTP API
     */
    async uploadFile(fileBuffer, filename) {
        try {
            const formData = new form_data_1.default();
            formData.append('file', fileBuffer, filename || 'file');
            const response = await axios_1.default.post(`${this.baseUrl}/api/v0/add`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 30000, // 30 second timeout
            });
            if (response.data && response.data.Hash) {
                return response.data.Hash;
            }
            else {
                throw new Error('Invalid response from IPFS node');
            }
        }
        catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('IPFS node is not running or not accessible');
            }
            else if (error.code === 'ETIMEDOUT') {
                throw new Error('IPFS upload timeout - node may be busy');
            }
            else {
                throw new Error(`IPFS upload failed: ${error.message}`);
            }
        }
    }
    /**
     * Retrieve a file from IPFS using direct HTTP API
     */
    async getFile(cid) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/v0/cat?arg=${cid}`, null, {
                responseType: 'arraybuffer',
                timeout: 30000,
            });
            return Buffer.from(response.data);
        }
        catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('IPFS node is not running or not accessible');
            }
            else if (error.code === 'ETIMEDOUT') {
                throw new Error('IPFS retrieval timeout');
            }
            else {
                throw new Error(`IPFS retrieval failed: ${error.message}`);
            }
        }
    }
    /**
     * Pin a file in IPFS using direct HTTP API
     */
    async pinFile(cid) {
        try {
            await axios_1.default.post(`${this.baseUrl}/api/v0/pin/add?arg=${cid}`, null, {
                timeout: 30000,
            });
        }
        catch (error) {
            if (error.code === 'ECONNREFUSED') {
                throw new Error('IPFS node is not running or not accessible');
            }
            else if (error.code === 'ETIMEDOUT') {
                throw new Error('IPFS pin timeout');
            }
            else {
                throw new Error(`IPFS pin failed: ${error.message}`);
            }
        }
    }
    /**
     * Check if IPFS node is accessible
     */
    async checkConnection() {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/v0/id`, null, {
                timeout: 5000,
            });
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get IPFS node information
     */
    async getNodeInfo() {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/v0/id`, null, {
                timeout: 10000,
            });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get IPFS node info: ${error.message}`);
        }
    }
}
exports.SimpleIpfsService = SimpleIpfsService;
// Export a default instance
exports.ipfsService = new SimpleIpfsService();
