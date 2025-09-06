'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Shield, Clock, Database, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { AnchoringStatusResponse, BatchesResponse, TransactionSearchResponse } from '@/lib/api-types';
import Link from 'next/link';

export default function MerkleVerificationPage() {
  const [anchoringStatus, setAnchoringStatus] = useState<AnchoringStatusResponse | null>(null);
  const [recentBatches, setRecentBatches] = useState<BatchesResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TransactionSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusResponse, batchesResponse] = await Promise.all([
        apiClient.getAnchoringStatus(),
        apiClient.getAllBatches(1, 5)
      ]);
      
      setAnchoringStatus(statusResponse);
      setRecentBatches(batchesResponse);
    } catch (err: any) {
      setError(err.message || 'Failed to load verification data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setSearching(true);
      const results = await apiClient.searchTransactions(searchQuery, 10);
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Merkle Verification</h1>
          <p className="text-muted-foreground">
            Verify transaction integrity through cryptographic proofs
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/w/transaction-verify">
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Verify Transaction
            </Button>
          </Link>
          <Link href="/w/anchoring-status">
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              System Status
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Search Transactions</TabsTrigger>
          <TabsTrigger value="batches">Recent Batches</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {anchoringStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{anchoringStatus.status.totalBatches}</div>
                  <p className="text-xs text-muted-foreground">
                    Anchored to Sepolia
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{anchoringStatus.status.totalTransactions}</div>
                  <p className="text-xs text-muted-foreground">
                    Cryptographically secured
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Anchored</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold">
                    {anchoringStatus.status.lastAnchoredAt 
                      ? formatDate(anchoringStatus.status.lastAnchoredAt)
                      : 'Never'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Latest batch processed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Service Status</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold text-green-600">Active</div>
                  <p className="text-xs text-muted-foreground">
                    Anchoring service running
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>What is Merkle Verification?</CardTitle>
              <CardDescription>
                Understanding cryptographic proof verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">🔐 Cryptographic Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Every transaction is secured using Merkle trees, creating tamper-proof cryptographic proofs
                    that can be verified without accessing private data.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">🌐 Public Verifiability</h4>
                  <p className="text-sm text-muted-foreground">
                    Transaction integrity is anchored to Ethereum Sepolia, allowing anyone to verify
                    authenticity without compromising privacy.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">⚡ Efficient Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    Thousands of transactions are compressed into a single Merkle root, making verification
                    fast and cost-effective.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">🕐 24/7 Anchoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Automated service runs daily at 2 AM UTC, ensuring all transactions are regularly
                    anchored for verification.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Transactions</CardTitle>
              <CardDescription>
                Find and verify specific transactions by hash
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter transaction hash (0x...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>

              {searchResults && (
                <div className="space-y-2">
                  <h4 className="font-semibold">
                    Search Results ({searchResults.data.count} found)
                  </h4>
                  {searchResults.data.results.length === 0 ? (
                    <p className="text-muted-foreground">No transactions found matching your query.</p>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.data.results.map((result, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="font-mono text-sm">{formatHash(result.transaction_hash)}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Badge variant="outline">Batch #{result.batch_id}</Badge>
                                  <span>{formatDate(result.anchored_at)}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Link href={`/w/transaction-verify?hash=${result.transaction_hash}`}>
                                  <Button size="sm" variant="outline">
                                    Verify
                                  </Button>
                                </Link>
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${result.sepolia_tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button size="sm" variant="outline">
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </a>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Anchoring Batches</CardTitle>
              <CardDescription>
                Latest batches anchored to Sepolia blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentBatches && recentBatches.data.batches.length > 0 ? (
                <div className="space-y-3">
                  {recentBatches.data.batches.map((batch) => (
                    <Card key={batch.batch_id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Batch #{batch.batch_id}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {batch.transaction_count} transactions
                              </span>
                            </div>
                            <p className="font-mono text-xs text-muted-foreground">
                              {formatHash(batch.merkle_root)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(batch.anchored_at)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/w/anchoring-status?batch=${batch.batch_id}`}>
                              <Button size="sm" variant="outline">
                                View Details
                              </Button>
                            </Link>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${batch.sepolia_tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No batches found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
