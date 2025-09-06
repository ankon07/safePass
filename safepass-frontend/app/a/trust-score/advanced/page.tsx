"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  BarChart3,
  Calculator,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { useAuth, withAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import {
  TrustScore,
  TrustScoreStatistics,
  TopAgenciesResponse,
  ApiError,
} from "@/lib/api-types";

interface TrustScoreEvent {
  id: string;
  agency_address: string;
  event_type: string;
  impact_score: number;
  timestamp: string;
  description?: string;
}

interface RecordEventForm {
  agency_address: string;
  event_type: string;
  impact_score: number;
  description: string;
}

function AdvancedTrustScoreManagement() {
  const { user } = useAuth();
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [statistics, setStatistics] = useState<TrustScoreStatistics | null>(null);
  const [topAgencies, setTopAgencies] = useState<TrustScore[]>([]);
  const [events, setEvents] = useState<TrustScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form states
  const [calculateAddress, setCalculateAddress] = useState("");
  const [recordEventForm, setRecordEventForm] = useState<RecordEventForm>({
    agency_address: "",
    event_type: "",
    impact_score: 0,
    description: "",
  });

  // Dialog states
  const [calculateDialogOpen, setCalculateDialogOpen] = useState(false);
  const [recordEventDialogOpen, setRecordEventDialogOpen] = useState(false);

  useEffect(() => {
    fetchTrustScoreData();
  }, []);

  const fetchTrustScoreData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statisticsResult, topAgenciesResult] = await Promise.all([
        apiClient.getTrustScoreStatistics().catch(() => null),
        apiClient.getTopAgencies(10).catch(() => null),
      ]);

      setStatistics(statisticsResult);
      setTopAgencies(topAgenciesResult?.agencies || []);

      // Fetch user's trust score if agency address is available
      if (user?.agency_address) {
        const [trustScoreResult, eventsResult] = await Promise.all([
          apiClient.getAgencyTrustScore(user.agency_address).catch(() => null),
          apiClient.getTrustScoreEvents(user.agency_address, 20).catch(() => null),
        ]);
        
        setTrustScore(trustScoreResult);
        setEvents((eventsResult as any)?.events || []);
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to load trust score data");
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateTrustScores = async () => {
    try {
      setActionLoading("calculate");
      await apiClient.calculateTrustScores(calculateAddress || undefined);
      setCalculateDialogOpen(false);
      setCalculateAddress("");
      await fetchTrustScoreData();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to calculate trust scores");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecordEvent = async () => {
    if (!recordEventForm.agency_address || !recordEventForm.event_type) return;

    try {
      setActionLoading("record-event");
      await apiClient.recordTrustScoreEvent({
        agency_address: recordEventForm.agency_address,
        event_type: recordEventForm.event_type,
        impact_score: recordEventForm.impact_score,
        description: recordEventForm.description,
      });
      
      setRecordEventDialogOpen(false);
      setRecordEventForm({
        agency_address: "",
        event_type: "",
        impact_score: 0,
        description: "",
      });
      await fetchTrustScoreData();
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.error || "Failed to record trust score event");
    } finally {
      setActionLoading(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case "successful_placement":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "verified_complaint":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "manual_adjustment":
        return <Zap className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-viridian-green" />
          <span className="ml-2 text-lg">Loading trust score data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-jungle-green">
              Advanced Trust Score Management
            </h1>
            <p className="text-slate-600 mt-2">
              Monitor, calculate, and manage trust scores across the platform
            </p>
          </div>
          <Button onClick={fetchTrustScoreData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Trust Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Trust Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {trustScore ? (
              <div>
                <div className={`text-2xl font-bold ${getScoreColor(trustScore.trust_score)}`}>
                  {trustScore.trust_score_display}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(trustScore.timestamp).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="text-2xl font-bold text-slate-400">N/A</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.total_agencies || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.average_score || "0.0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Range</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div>Min: {statistics?.min_score || "0.0"}</div>
              <div>Max: {statistics?.max_score || "0.0"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calculate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calculate">Calculate Scores</TabsTrigger>
          <TabsTrigger value="events">Record Events</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="history">Event History</TabsTrigger>
        </TabsList>

        <TabsContent value="calculate" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trust Score Calculation</CardTitle>
                  <CardDescription>
                    Recalculate trust scores for all agencies or a specific agency
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Dialog open={calculateDialogOpen} onOpenChange={setCalculateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate Scores
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Calculate Trust Scores</DialogTitle>
                        <DialogDescription>
                          Recalculate trust scores based on recent events and performance data
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="agency-address">
                            Agency Address (Optional - leave empty for all agencies)
                          </Label>
                          <Input
                            id="agency-address"
                            value={calculateAddress}
                            onChange={(e) => setCalculateAddress(e.target.value)}
                            placeholder="0x... (optional)"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleCalculateTrustScores}
                          disabled={actionLoading === "calculate"}
                        >
                          {actionLoading === "calculate" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Calculate Scores
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  Trust scores are calculated based on successful placements, verified complaints, and other performance metrics
                </p>
                <p className="text-sm text-slate-500">
                  Click "Calculate Scores" to trigger a recalculation of trust scores
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Record Trust Score Events</CardTitle>
                  <CardDescription>
                    Manually record events that impact trust scores
                  </CardDescription>
                </div>
                <Dialog open={recordEventDialogOpen} onOpenChange={setRecordEventDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Record Trust Score Event</DialogTitle>
                      <DialogDescription>
                        Record an event that will impact an agency's trust score
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="event-agency-address">Agency Address</Label>
                        <Input
                          id="event-agency-address"
                          value={recordEventForm.agency_address}
                          onChange={(e) =>
                            setRecordEventForm({ ...recordEventForm, agency_address: e.target.value })
                          }
                          placeholder="0x..."
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="event-type">Event Type</Label>
                        <Select
                          value={recordEventForm.event_type}
                          onValueChange={(value) =>
                            setRecordEventForm({ ...recordEventForm, event_type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="successful_placement">Successful Placement</SelectItem>
                            <SelectItem value="verified_complaint">Verified Complaint</SelectItem>
                            <SelectItem value="manual_adjustment">Manual Adjustment</SelectItem>
                            <SelectItem value="initial_score">Initial Score</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="impact-score">Impact Score</Label>
                        <Input
                          id="impact-score"
                          type="number"
                          value={recordEventForm.impact_score}
                          onChange={(e) =>
                            setRecordEventForm({ ...recordEventForm, impact_score: Number(e.target.value) })
                          }
                          placeholder="10"
                        />
                        <p className="text-sm text-slate-500">
                          Positive values increase trust score, negative values decrease it
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="event-description">Description (Optional)</Label>
                        <Textarea
                          id="event-description"
                          value={recordEventForm.description}
                          onChange={(e) =>
                            setRecordEventForm({ ...recordEventForm, description: e.target.value })
                          }
                          placeholder="Additional details about this event..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleRecordEvent}
                        disabled={
                          actionLoading === "record-event" ||
                          !recordEventForm.agency_address ||
                          !recordEventForm.event_type
                        }
                      >
                        {actionLoading === "record-event" && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Record Event
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Plus className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  Record events that impact trust scores such as successful placements or verified complaints
                </p>
                <p className="text-sm text-slate-500">
                  Events are used to calculate and update agency trust scores automatically
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Agencies Leaderboard</CardTitle>
              <CardDescription>
                Agencies ranked by their trust scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topAgencies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Agency</TableHead>
                      <TableHead>Trust Score</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topAgencies.map((agency, index) => (
                      <TableRow key={agency.agency_address}>
                        <TableCell>
                          <div className="flex items-center">
                            {index === 0 && <Trophy className="h-4 w-4 text-yellow-500 mr-2" />}
                            {index === 1 && <Trophy className="h-4 w-4 text-gray-400 mr-2" />}
                            {index === 2 && <Trophy className="h-4 w-4 text-amber-600 mr-2" />}
                            #{index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {agency.agency_name || "Unknown Agency"}
                            </div>
                            <div className="text-sm text-slate-500 font-mono">
                              {agency.agency_address.slice(0, 10)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getScoreBadgeVariant(agency.trust_score)}>
                            {agency.trust_score_display}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(agency.timestamp).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  No agencies found in the leaderboard
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trust Score Event History</CardTitle>
              <CardDescription>
                Recent events affecting your agency's trust score
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center">
                            {getEventTypeIcon(event.event_type)}
                            <span className="ml-2 capitalize">
                              {event.event_type.replace("_", " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.event_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              event.impact_score > 0
                                ? "text-green-600"
                                : event.impact_score < 0
                                ? "text-red-600"
                                : "text-slate-600"
                            }
                          >
                            {event.impact_score > 0 ? "+" : ""}
                            {event.impact_score}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(event.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {event.description || "No description"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  {user?.agency_address
                    ? "No trust score events found for your agency"
                    : "Agency address not configured"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(AdvancedTrustScoreManagement, ["AgencyAdmin"]);
