import { Router, Request, Response } from 'express';
import { supabase, UserPublicProfile } from '../config/supabase';
import { authenticateToken, requireRole } from '../middleware/auth';
import { cache, cacheKeys, cacheInvalidation, CACHE_TTL } from '../middleware/cache';

const router = Router();

// GET /api/users - Get all users (Admin/Regulator only)
router.get('/', 
  authenticateToken, 
  requireRole(['AgencyAdmin', 'Regulator']),
  cache({
    ttl: CACHE_TTL.USER_LIST,
    keyGenerator: cacheKeys.userList
  }),
  async (req: Request, res: Response) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, did, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    const userProfiles: UserPublicProfile[] = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      did: user.did,
      created_at: user.created_at,
    }));

    res.status(200).json({
      users: userProfiles,
      total: userProfiles.length,
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/workers - Get all workers (Agency Admin/Regulator only)
router.get('/workers', 
  authenticateToken, 
  requireRole(['AgencyAdmin', 'Regulator']),
  cache({
    ttl: CACHE_TTL.USER_LIST,
    keyGenerator: cacheKeys.workerList
  }),
  async (req: Request, res: Response) => {
  try {
    const { data: workers, error } = await supabase
      .from('users')
      .select('id, email, name, role, did, created_at')
      .eq('role', 'Worker')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ error: 'Failed to fetch workers' });
    }

    const workerProfiles: UserPublicProfile[] = workers.map(worker => ({
      id: worker.id,
      email: worker.email,
      name: worker.name,
      role: worker.role,
      did: worker.did,
      created_at: worker.created_at,
    }));

    res.status(200).json({
      workers: workerProfiles,
      total: workerProfiles.length,
    });

  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id - Get user by ID (Admin/Regulator or own profile)
router.get('/:id', 
  authenticateToken,
  cache({
    ttl: CACHE_TTL.USER_PROFILE,
    keyGenerator: (req: Request) => `user:profile:${req.params.id}:${req.user?.id}`
  }),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    // Check if user is trying to access their own profile or has admin privileges
    if (currentUser.id !== id && !['AgencyAdmin', 'Regulator'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Access denied. You can only view your own profile.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, did, created_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userProfile: UserPublicProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      did: user.did,
      created_at: user.created_at,
    };

    res.status(200).json({
      user: userProfile,
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/stats/overview - Get user statistics (Admin/Regulator only)
router.get('/stats/overview', 
  authenticateToken, 
  requireRole(['AgencyAdmin', 'Regulator']),
  cache({
    ttl: CACHE_TTL.STATISTICS,
    keyGenerator: cacheKeys.userStats
  }),
  async (req: Request, res: Response) => {
  try {
    // Get total counts by role
    const { data: stats, error } = await supabase
      .from('users')
      .select('role')
      .order('role');

    if (error) {
      console.error('Database query error:', error);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    const roleCounts = stats.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    const totalUsers = stats.length;

    res.status(200).json({
      totalUsers,
      roleBreakdown: {
        workers: roleCounts.Worker || 0,
        agencyAdmins: roleCounts.AgencyAdmin || 0,
        regulators: roleCounts.Regulator || 0,
      },
      statistics: roleCounts,
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
