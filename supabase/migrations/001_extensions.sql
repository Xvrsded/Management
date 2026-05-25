-- Extensions Setup
-- Safe extension initialization for Supabase

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for hashing functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pg_trgm for text similarity searches
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
