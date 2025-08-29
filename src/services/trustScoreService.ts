import cron from 'node-cron';
import { supabase } from '../config/supabase';
import { blockchainService } from './blockchain/blockchainService';
import { EventEmitter } from 'events';

interface TrustScoreConfig {
  alpha_successful_placement: number;
  beta_verified_complaint: number;
  gamma_dispute_resolution: number;
  min_trust_score: number;
  max_trust_score: number;
  default_trust_score: number;
  calculation_frequency_hours: number;
}

interface AgencyTrustData {
  agency_address: string;
  agency_did?: string;
  current_score: number;
  successful_placements: number;
  verified_complaints: number;
  dispute_resolutions: number;
}

interface TrustScoreEvent {
  agency_address: string;
  event_type: 'successful_placement' | 'verified_complaint' | 'manual_adjustment' | 'initial_score';
  contract_address?: string;
  employment_contract_id?: string;
  impact_score: number;
  event_data?: any;
}

class TrustScoreService extends EventEmitter {
  private config: TrustScoreConfig | null = null;
  private isCalculating = false;
  private cronJob: any = null;

  constructor() {
    super();
    this.loadConfiguration();
  }

  /**
   * Load trust score configuration from database
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('trust_score_config')
        .select('parameter_name, parameter_value');

      if (error) {
        console.error('Error loading trust score config:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn('No trust score configuration found, using defaults');
        this.config = {
          alpha_successful_placement: 1.0,
          beta_verified_complaint: 10.0,
          gamma_dispute_resolution: 5.0,
          min_trust_score: 0.0,
          max_trust_score: 200.0,
          default_trust_score: 100.0,
          calculation_frequency_hours: 24.0
        };
        return;
      }

      // Convert array to config object
      this.config = data.reduce((acc, item) => {
        acc[item.parameter_name as keyof TrustScoreConfig] = parseFloat(item.parameter_value);
        return acc;
      }, {} as TrustScoreConfig);

      console.log('Trust score configuration loaded:', this.config);
    } catch (error) {
      console.error('Error loading trust score configuration:', error);
    }
  }

  /**
   * Start the trust score calculation scheduler
   */
  public startTrustScoreCalculator(): void {
    if (!this.config) {
      console.error('Trust score configuration not loaded, cannot start calculator');
      return;
    }

    // Calculate schedule based on configuration (default: daily at midnight)
    const hours = Math.floor(this.config.calculation_frequency_hours);
    const schedule = hours >= 24 ? '0 0 * * *' : `0 */${hours} * * *`;

    console.log(`Starting trust score calculator with schedule: ${schedule}`);

    this.cronJob = cron.schedule(schedule, async () => {
      console.log('Running scheduled trust score calculation...');
      await this.calculateAllAgencyScores();
    });

    // Run initial calculation
    setTimeout(() => {
      this.calculateAllAgencyScores();
    }, 5000); // Wait 5 seconds after startup
  }

  /**
   * Stop the trust score calculator
   */
  public stopTrustScoreCalculator(): void {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
      console.log('Trust score calculator stopped');
    }
  }

  /**
   * Calculate trust scores for all registered agencies
   */
  public async calculateAllAgencyScores(): Promise<void> {
    if (this.isCalculating) {
      console.log('Trust score calculation already in progress, skipping...');
      return;
    }

    if (!this.config) {
      console.error('Trust score configuration not loaded');
      return;
    }

    this.isCalculating = true;

    try {
      console.log('Starting trust score calculation for all agencies...');

      // Get all registered agencies from blockchain
      const agencies = await this.getAllRegisteredAgencies();
      console.log(`Found ${agencies.length} registered agencies`);

      for (const agencyAddress of agencies) {
        try {
          await this.calculateAgencyScore(agencyAddress);
        } catch (error) {
          console.error(`Error calculating score for agency ${agencyAddress}:`, error);
        }
      }

      console.log('Trust score calculation completed for all agencies');
      this.emit('calculationCompleted', { agencyCount: agencies.length });

    } catch (error) {
      console.error('Error in calculateAllAgencyScores:', error);
      this.emit('calculationError', error);
    } finally {
      this.isCalculating = false;
    }
  }

  /**
   * Calculate trust score for a specific agency
   */
  public async calculateAgencyScore(agencyAddress: string): Promise<number> {
    if (!this.config) {
      throw new Error('Trust score configuration not loaded');
    }

    try {
      // Get current trust data for the agency
      const trustData = await this.getAgencyTrustData(agencyAddress);
      
      // Get new events since last calculation
      const newEvents = await this.getNewTrustScoreEvents(agencyAddress);
      
      if (newEvents.length === 0) {
        console.log(`No new events for agency ${agencyAddress}, skipping calculation`);
        return trustData.current_score;
      }

      // Calculate new score based on events
      let newScore = trustData.current_score;
      let successfulPlacements = trustData.successful_placements;
      let verifiedComplaints = trustData.verified_complaints;
      let disputeResolutions = trustData.dispute_resolutions;

      for (const event of newEvents) {
        switch (event.event_type) {
          case 'successful_placement':
            successfulPlacements++;
            newScore += this.config.alpha_successful_placement * 10; // Scale by 10
            break;
          case 'verified_complaint':
            verifiedComplaints++;
            newScore -= this.config.beta_verified_complaint * 10; // Scale by 10
            break;
          case 'manual_adjustment':
            newScore += event.impact_score;
            break;
        }
      }

      // Apply bounds
      newScore = Math.max(this.config.min_trust_score * 10, newScore);
      newScore = Math.min(this.config.max_trust_score * 10, newScore);
      newScore = Math.round(newScore);

      // Store the new score
      await this.storeTrustScore(agencyAddress, trustData.agency_did, {
        trust_score: newScore,
        successful_placements: successfulPlacements,
        verified_complaints: verifiedComplaints,
        score_change: newScore - trustData.current_score,
        calculation_details: {
          previous_score: trustData.current_score,
          events_processed: newEvents.length,
          config_used: this.config
        }
      });

      // Update blockchain if AgencyRegistry is available
      await this.updateBlockchainTrustScore(agencyAddress, newScore);

      // Mark events as processed
      await this.markEventsAsProcessed(newEvents.map(e => e.id));

      console.log(`Updated trust score for ${agencyAddress}: ${trustData.current_score} -> ${newScore}`);
      
      this.emit('scoreUpdated', {
        agencyAddress,
        oldScore: trustData.current_score,
        newScore,
        eventsProcessed: newEvents.length
      });

      return newScore;

    } catch (error) {
      console.error(`Error calculating trust score for ${agencyAddress}:`, error);
      throw error;
    }
  }

  /**
   * Record a trust score event
   */
  public async recordTrustScoreEvent(event: TrustScoreEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('trust_score_events')
        .insert({
          agency_address: event.agency_address,
          event_type: event.event_type,
          contract_address: event.contract_address,
          employment_contract_id: event.employment_contract_id,
          impact_score: event.impact_score,
          event_data: event.event_data
        });

      if (error) {
        throw error;
      }

      console.log(`Recorded trust score event: ${event.event_type} for ${event.agency_address}`);
      this.emit('eventRecorded', event);

    } catch (error) {
      console.error('Error recording trust score event:', error);
      throw error;
    }
  }

  /**
   * Get trust score for an agency
   */
  public async getAgencyTrustScore(agencyAddress: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('agency_trust_scores')
        .select('trust_score')
        .eq('agency_address', agencyAddress)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.trust_score;
    } catch (error) {
      console.error(`Error getting trust score for ${agencyAddress}:`, error);
      return null;
    }
  }

  /**
   * Get trust score statistics
   */
  public async getTrustScoreStatistics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('agency_trust_scores')
        .select('trust_score, successful_placements, verified_complaints');

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          total_agencies: 0,
          average_score: 0,
          min_score: 0,
          max_score: 0,
          median_score: 0
        };
      }

      const scores = data.map(d => d.trust_score);
      const sortedScores = scores.sort((a, b) => a - b);
      
      return {
        total_agencies: data.length,
        average_score: scores.reduce((a, b) => a + b, 0) / scores.length,
        min_score: Math.min(...scores),
        max_score: Math.max(...scores),
        median_score: sortedScores[Math.floor(sortedScores.length / 2)],
        total_successful_placements: data.reduce((sum, d) => sum + (d.successful_placements || 0), 0),
        total_verified_complaints: data.reduce((sum, d) => sum + (d.verified_complaints || 0), 0)
      };
    } catch (error) {
      console.error('Error getting trust score statistics:', error);
      throw error;
    }
  }

  /**
   * Get top agencies by trust score
   */
  public async getTopAgencies(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('agency_trust_scores')
        .select('agency_address, agency_did, trust_score, successful_placements, verified_complaints, calculated_at')
        .order('trust_score', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting top agencies:', error);
      return [];
    }
  }

  // Private helper methods

  private async getAllRegisteredAgencies(): Promise<string[]> {
    try {
      // Try to get from blockchain first
      if (blockchainService.getContract && blockchainService.getContract('AgencyRegistry')) {
        const agencies = await blockchainService.callContractMethod('AgencyRegistry', 'getAllAgencies');
        return agencies;
      }

      // Fallback to database
      const { data, error } = await supabase
        .from('users')
        .select('did')
        .eq('role', 'AgencyAdmin');

      if (error) {
        throw error;
      }

      return data?.map(u => u.did).filter(Boolean) || [];
    } catch (error) {
      console.error('Error getting registered agencies:', error);
      return [];
    }
  }

  private async getAgencyTrustData(agencyAddress: string): Promise<AgencyTrustData> {
    try {
      const { data, error } = await supabase
        .from('agency_trust_scores')
        .select('*')
        .eq('agency_address', agencyAddress)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        // Return default data for new agency
        return {
          agency_address: agencyAddress,
          current_score: this.config?.default_trust_score ? this.config.default_trust_score * 10 : 1000,
          successful_placements: 0,
          verified_complaints: 0,
          dispute_resolutions: 0
        };
      }

      return {
        agency_address: data.agency_address,
        agency_did: data.agency_did,
        current_score: data.trust_score,
        successful_placements: data.successful_placements,
        verified_complaints: data.verified_complaints,
        dispute_resolutions: 0 // TODO: Add this field to schema if needed
      };
    } catch (error) {
      console.error(`Error getting trust data for ${agencyAddress}:`, error);
      throw error;
    }
  }

  private async getNewTrustScoreEvents(agencyAddress: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('trust_score_events')
        .select('*')
        .eq('agency_address', agencyAddress)
        .is('processed_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`Error getting new events for ${agencyAddress}:`, error);
      return [];
    }
  }

  private async storeTrustScore(agencyAddress: string, agencyDid: string | undefined, scoreData: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('agency_trust_scores')
        .insert({
          agency_address: agencyAddress,
          agency_did: agencyDid,
          trust_score: scoreData.trust_score,
          successful_placements: scoreData.successful_placements,
          verified_complaints: scoreData.verified_complaints,
          score_change: scoreData.score_change,
          calculation_details: scoreData.calculation_details
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(`Error storing trust score for ${agencyAddress}:`, error);
      throw error;
    }
  }

  private async updateBlockchainTrustScore(agencyAddress: string, newScore: number): Promise<void> {
    try {
      if (!blockchainService.getContract) {
        return;
      }

      const agencyRegistry = blockchainService.getContract('AgencyRegistry');
      if (!agencyRegistry) {
        console.log('AgencyRegistry contract not available, skipping blockchain update');
        return;
      }

      // Check if agency is registered on blockchain
      const isRegistered = await blockchainService.callContractMethod('AgencyRegistry', 'isAgencyRegistered', [agencyAddress]);
      
      if (isRegistered) {
        await blockchainService.executeContractMethod('AgencyRegistry', 'updateTrustScore', [agencyAddress, newScore]);
        console.log(`Updated blockchain trust score for ${agencyAddress}: ${newScore}`);
      }
    } catch (error) {
      console.error(`Error updating blockchain trust score for ${agencyAddress}:`, error);
      // Don't throw - blockchain update is optional
    }
  }

  private async markEventsAsProcessed(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('trust_score_events')
        .update({ processed_at: new Date().toISOString() })
        .in('id', eventIds);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error marking events as processed:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const trustScoreService = new TrustScoreService();

export default TrustScoreService;
