import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { trustScoreService } from '../services/trustScoreService';
import { zkpService } from '../services/zkpService';

const router = express.Router();

/**
 * GET /api/trust-scores/agencies/:address
 * Get trust score for a specific agency
 */
router.get('/agencies/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        error: 'Agency address is required'
      });
    }

    const trustScore = await trustScoreService.getAgencyTrustScore(address);
    
    if (trustScore === null) {
      return res.status(404).json({
        error: 'Trust score not found for this agency'
      });
    }

    res.json({
      agency_address: address,
      trust_score: trustScore,
      trust_score_display: (trustScore / 10).toFixed(1), // Convert back to decimal
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting agency trust score:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/trust-scores/statistics
 * Get trust score statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await trustScoreService.getTrustScoreStatistics();
    
    // Convert scaled values back to display format
    const displayStats = {
      ...statistics,
      average_score: statistics.average_score ? (statistics.average_score / 10).toFixed(1) : null,
      min_score: statistics.min_score ? (statistics.min_score / 10).toFixed(1) : null,
      max_score: statistics.max_score ? (statistics.max_score / 10).toFixed(1) : null,
      median_score: statistics.median_score ? (statistics.median_score / 10).toFixed(1) : null
    };

    res.json(displayStats);

  } catch (error) {
    console.error('Error getting trust score statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/trust-scores/top-agencies
 * Get top agencies by trust score
 */
router.get('/top-agencies', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Limit must be between 1 and 100'
      });
    }

    const topAgencies = await trustScoreService.getTopAgencies(limit);
    
    // Convert scaled scores back to display format
    const displayAgencies = topAgencies.map(agency => ({
      ...agency,
      trust_score_display: (agency.trust_score / 10).toFixed(1)
    }));

    res.json({
      agencies: displayAgencies,
      count: displayAgencies.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting top agencies:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/trust-scores/calculate
 * Manually trigger trust score calculation (Regulator only)
 */
router.post('/calculate', authenticateToken, async (req, res) => {
  try {
    // Check if user is a regulator
    if (req.user?.role !== 'Regulator') {
      return res.status(403).json({
        error: 'Only regulators can trigger trust score calculations'
      });
    }

    const { agency_address } = req.body;

    if (agency_address) {
      // Calculate for specific agency
      const newScore = await trustScoreService.calculateAgencyScore(agency_address);
      
      res.json({
        message: 'Trust score calculated successfully',
        agency_address,
        new_score: newScore,
        new_score_display: (newScore / 10).toFixed(1),
        timestamp: new Date().toISOString()
      });
    } else {
      // Calculate for all agencies
      await trustScoreService.calculateAllAgencyScores();
      
      res.json({
        message: 'Trust score calculation initiated for all agencies',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error calculating trust scores:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/trust-scores/events
 * Record a trust score event (Regulator only)
 */
router.post('/events', authenticateToken, async (req, res) => {
  try {
    // Check if user is a regulator
    if (req.user?.role !== 'Regulator') {
      return res.status(403).json({
        error: 'Only regulators can record trust score events'
      });
    }

    const { 
      agency_address, 
      event_type, 
      contract_address, 
      employment_contract_id, 
      impact_score, 
      event_data 
    } = req.body;

    // Validate required fields
    if (!agency_address || !event_type || impact_score === undefined) {
      return res.status(400).json({
        error: 'agency_address, event_type, and impact_score are required'
      });
    }

    // Validate event type
    const validEventTypes = ['successful_placement', 'verified_complaint', 'manual_adjustment', 'initial_score'];
    if (!validEventTypes.includes(event_type)) {
      return res.status(400).json({
        error: 'Invalid event_type. Must be one of: ' + validEventTypes.join(', ')
      });
    }

    await trustScoreService.recordTrustScoreEvent({
      agency_address,
      event_type,
      contract_address,
      employment_contract_id,
      impact_score: parseInt(impact_score),
      event_data
    });

    res.json({
      message: 'Trust score event recorded successfully',
      event_type,
      agency_address,
      impact_score,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error recording trust score event:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/trust-scores/events/:agencyAddress
 * Get trust score events for an agency
 */
router.get('/events/:agencyAddress', async (req, res) => {
  try {
    const { agencyAddress } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // This would require a new method in trustScoreService
    // For now, return a placeholder response
    res.json({
      agency_address: agencyAddress,
      events: [],
      message: 'Event history endpoint - implementation pending'
    });

  } catch (error) {
    console.error('Error getting trust score events:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
