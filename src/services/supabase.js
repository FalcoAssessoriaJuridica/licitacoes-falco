import { createClient } from '@supabase/supabase-js';

// Fallbacks seguros de produção (Supabase Cloud)
const PROD_SUPABASE_URL = "https://djzlxcllzznrjqbtgnen.supabase.co";
const PROD_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqemx4Y2xsenpucmpxYnRnbmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5OTU1MzEsImV4cCI6MjEwNDU3MTUzMX0.7ui1XU2jBPpDX8mSm1CSyZQepzqHNjPSsg0A-F1JWAA";

// Função segura para ler variáveis de ambiente em browser (Vite) ou Node.js
const getEnvVar = (key, fallback) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', PROD_SUPABASE_URL);
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', PROD_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

