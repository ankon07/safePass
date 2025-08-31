'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, ApiError } from './api-types';
import { apiClient } from './api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'Worker' | 'AgencyAdmin' | 'Regulator') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refreshUser = async () => {
    try {
      if (apiClient.isAuthenticated()) {
        const response = await apiClient.getCurrentUser();
        setUser(response.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // Don't set error here as it might be due to expired token
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.login({ email, password });
      setUser(response.user);
      
      // Redirect based on user role
      const redirectPath = getRoleBasedRedirectPath(response.user.role);
      window.location.href = redirectPath;
    } catch (error) {
      const apiError = error as ApiError & { status?: number };
      setError(apiError.error || 'Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    role: 'Worker' | 'AgencyAdmin' | 'Regulator'
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await apiClient.register({ name, email, password, role });
      
      // After successful registration, log the user in
      await login(email, password);
    } catch (error) {
      const apiError = error as ApiError & { status?: number };
      setError(apiError.error || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    apiClient.logout();
  };

  const getRoleBasedRedirectPath = (role: string): string => {
    switch (role) {
      case 'Worker':
        return '/w/dashboard';
      case 'AgencyAdmin':
        return '/a/dashboard';
      case 'Regulator':
        return '/r/dashboard'; // Assuming regulator dashboard exists
      default:
        return '/dashboard';
    }
  };

  // Check for existing authentication on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: ('Worker' | 'AgencyAdmin' | 'Regulator')[]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-viridian-green"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook for role-based access control
export function useRoleAccess() {
  const { user } = useAuth();

  const hasRole = (role: 'Worker' | 'AgencyAdmin' | 'Regulator'): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: ('Worker' | 'AgencyAdmin' | 'Regulator')[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const isWorker = (): boolean => hasRole('Worker');
  const isAgencyAdmin = (): boolean => hasRole('AgencyAdmin');
  const isRegulator = (): boolean => hasRole('Regulator');

  return {
    user,
    hasRole,
    hasAnyRole,
    isWorker,
    isAgencyAdmin,
    isRegulator,
  };
}

// Custom hook for handling API errors with auth context
export function useApiError() {
  const { error, clearError } = useAuth();

  const handleApiError = (error: unknown) => {
    const apiError = error as ApiError & { status?: number };
    
    if (apiError.status === 401) {
      // Token expired or invalid - handled by API client
      return;
    }
    
    // Set error in auth context for global error handling
    console.error('API Error:', apiError);
  };

  return {
    error,
    clearError,
    handleApiError,
  };
}
