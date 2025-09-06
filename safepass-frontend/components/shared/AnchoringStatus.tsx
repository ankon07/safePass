'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Anchor, ExternalLink, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface AnchoringStats {
  totalBatches: number;
  totalTransactions: number;
  lastAnchoredAt: string | null;
  latestBatch: {
    batch_id: number;
    merkle_root: string;
    transaction_count: number;
    anchored_at: string;
    sepolia_tx_hash: string;
    sepolia_block_number: number;
  } | null;
  sepoliaContract: string;
}

interface ServiceStatus {
  service_name: string;
  last_run_at: string | null;
  last_success_at: string | null;
  last_error_at: string | null;
  last_error_message: string | null;
  next_scheduled_run: string | null;
  is_enabled: boolean;
}

interface AnchoringStatusData {
  success: boolean;
  status: AnchoringStats & {
    serviceStatus: ServiceStatus | null;
    lastUpdate: string;
  };
  error?: string;
}

export function AnchoringStatus() {
  const [status, setStatus] = useState<AnchoringStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const response = await fetch('/api/verification/status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch anchoring status');
      }
    } catch (err: any) {
      console.error('Failed to fetch anchoring status:', err);
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchStatus(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchStatus(true);
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getServiceHealthStatus = () => {
    if (!status?.status.serviceStatus) return { status: 'unknown', color: 'gray' };
    
    const service = status.status.serviceStatus;
    const lastError = service.last_error_at ? new Date(service.last_error_at) : null;
    const lastSuccess = service.last_success_at ? new Date(service.last_success_at) : null;
    
    if (!service.is_enabled) {
      return { status: 'disabled', color: 'gray' };
    }
    
    if (lastError && lastSuccess && lastError > lastSuccess) {
      return { status: 'error', color: 'red' };
    }
    
    if (lastSuccess) {
      const hoursSinceSuccess = (Date.now() - lastSuccess.getTime()) / (1000 * 60 * 60);
      if (hoursSinceSuccess > 25) { // Should run daily
        return { status: 'stale', color: 'yellow' };
      }
      return { status: 'healthy', color: 'green' };
    }
    
    return { status: 'unknown', color: 'gray' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Anchor className="h-5 w-5" />
            <span>Anchoring Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading anchoring status...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Anchor className="h-5 w-5" />
            <span>Anchoring Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="text-red-700 font-medium">Failed to load anchoring status</p>
                <p className="text-red-600 text-sm">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const healthStatus = getServiceHealthStatus();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Anchor className="h-5 w-5" />
            <span>Anchoring Status</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${
                healthStatus.color === 'green' ? 'border-green-500 text-green-700' :
                healthStatus.color === 'yellow' ? 'border-yellow-500 text-yellow-700' :
                healthStatus.color === 'red' ? 'border-red-500 text-red-700' :
                'border-gray-500 text-gray-700'
              }`}
            >
              {healthStatus.status === 'healthy' && <CheckCircle className="w-3 h-3 mr-1" />}
              {healthStatus.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
              {healthStatus.status === 'stale' && <Clock className="w-3 h-3 mr-1" />}
              {healthStatus.status.charAt(0).toUpperCase() + healthStatus.status.slice(1)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {status.status.totalBatches || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Total Batches
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {status.status.totalTransactions || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              Anchored Transactions
            </div>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              🔗 Sepolia
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">
              Public Chain
            </div>
          </div>
        </div>

        {/* Service Status */}
        {status.status.serviceStatus && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2 text-sm">Service Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Last Run:</span>
                <div className="font-medium">
                  {formatTimeAgo(status.status.serviceStatus.last_run_at)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Success:</span>
                <div className="font-medium">
                  {formatTimeAgo(status.status.serviceStatus.last_success_at)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Next Run:</span>
                <div className="font-medium">
                  {status.status.serviceStatus.next_scheduled_run ? 
                    new Date(status.status.serviceStatus.next_scheduled_run).toLocaleString() : 
                    'Not scheduled'
                  }
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Enabled:</span>
                <div className="font-medium">
                  {status.status.serviceStatus.is_enabled ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>
            
            {/* Error Message */}
            {status.status.serviceStatus.last_error_message && (
              <Alert className="mt-3 border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="text-yellow-700 font-medium text-sm">Last Error:</p>
                    <p className="text-yellow-600 text-xs">{status.status.serviceStatus.last_error_message}</p>
                    <p className="text-yellow-600 text-xs">
                      Occurred: {formatTimeAgo(status.status.serviceStatus.last_error_at)}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {/* Latest Batch */}
        {status.status.latestBatch && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2 text-sm">Latest Batch</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch ID:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  #{status.status.latestBatch.batch_id}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions:</span>
                <span className="font-medium">{status.status.latestBatch.transaction_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Anchored:</span>
                <span className="font-medium">
                  {formatTimeAgo(status.status.latestBatch.anchored_at)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sepolia TX:</span>
                <Button variant="ghost" size="sm" asChild className="h-6 p-1">
                  <a 
                    href={`https://sepolia.etherscan.io/tx/${status.status.latestBatch.sepolia_tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs flex items-center"
                  >
                    View <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Contract Link */}
        {status.status.sepoliaContract && (
          <div className="border-t pt-4">
            <Button variant="outline" size="sm" asChild className="w-full">
              <a 
                href={`https://sepolia.etherscan.io/address/${status.status.sepoliaContract}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Anchor Contract on Etherscan
              </a>
            </Button>
          </div>
        )}

        {/* Last Update */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Last updated: {new Date(status.status.lastUpdate).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
