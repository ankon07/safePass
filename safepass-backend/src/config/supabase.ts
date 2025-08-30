import { createClient } from '@supabase/supabase-js';
import { config } from './environment';

export const supabase = createClient(config.supabase.url, config.supabase.anonKey);

// Database schema types
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'Worker' | 'AgencyAdmin' | 'Regulator';
  did: string;
  encrypted_private_key_hex: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserCreateInput {
  email: string;
  password_hash: string;
  name: string;
  role: 'Worker' | 'AgencyAdmin' | 'Regulator';
  did: string;
  encrypted_private_key_hex: string;
}

export interface UserPublicProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  did: string;
  created_at?: string;
}
