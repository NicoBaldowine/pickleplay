-- ========================================
-- COMPLETE DATABASE SETUP FOR PICKLEPLAY
-- ========================================

-- 1. CLEAN EVERYTHING FIRST (SAFE VERSION)
-- ========================================

-- Drop triggers only if the table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_users' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_game_users_updated_at ON public.game_users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'games' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_games_updated_at ON public.games;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'double_partners' AND table_schema = 'public') THEN
        DROP TRIGGER IF EXISTS update_double_partners_updated_at ON public.double_partners;
    END IF;
    
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop tables in correct order
DROP TABLE IF EXISTS public.game_users;
DROP TABLE IF EXISTS public.games;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.double_partners;

-- 2. CREATE PROFILES TABLE (IF NOT EXISTS)
-- ========================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED,
    pickleball_level TEXT DEFAULT 'beginner',
    city TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for better performance (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_email') THEN
        CREATE INDEX idx_profiles_email ON public.profiles(email);
    END IF;
END $$;

-- 3. CREATE GAMES TABLES (IF NOT EXISTS)
-- ========================================

-- Games table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Game details
    game_type TEXT NOT NULL CHECK (game_type IN ('singles', 'doubles')),
    skill_level TEXT NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    max_players INTEGER NOT NULL DEFAULT 4,
    current_players INTEGER NOT NULL DEFAULT 1,
    
    -- Location
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    city TEXT NOT NULL,
    
    -- Schedule
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 90,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'in_progress', 'completed', 'cancelled')),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game participants table
CREATE TABLE IF NOT EXISTS public.game_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Player details
    role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('creator', 'player')),
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    
    -- For doubles
    team TEXT CHECK (team IN ('A', 'B')),
    
    -- Timestamps
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user can only join once per game
    UNIQUE(game_id, user_id)
);

-- Double partners table
CREATE TABLE IF NOT EXISTS public.double_partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Partner information
    partner_name TEXT NOT NULL,
    partner_level TEXT NOT NULL CHECK (partner_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    partner_email TEXT,
    partner_phone TEXT,
    
    -- Registration status
    is_registered BOOLEAN DEFAULT FALSE,
    registered_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user doesn't have duplicate partner names
    UNIQUE(user_id, partner_name)
);

-- Indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_games_creator') THEN
        CREATE INDEX idx_games_creator ON public.games(creator_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_games_date') THEN
        CREATE INDEX idx_games_date ON public.games(scheduled_date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_games_status') THEN
        CREATE INDEX idx_games_status ON public.games(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_game_users_game') THEN
        CREATE INDEX idx_game_users_game ON public.game_users(game_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_game_users_user') THEN
        CREATE INDEX idx_game_users_user ON public.game_users(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_double_partners_user') THEN
        CREATE INDEX idx_double_partners_user ON public.double_partners(user_id);
    END IF;
END $$;

-- 4. PERMISSIONS (DISABLED FOR DEVELOPMENT)
-- ========================================

-- Disable RLS for development
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.games DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.double_partners DISABLE ROW LEVEL SECURITY;

-- Grant full permissions for development
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT ALL ON public.games TO anon;
GRANT ALL ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;

GRANT ALL ON public.game_users TO anon;
GRANT ALL ON public.game_users TO authenticated;
GRANT ALL ON public.game_users TO service_role;

GRANT ALL ON public.double_partners TO anon;
GRANT ALL ON public.double_partners TO authenticated;
GRANT ALL ON public.double_partners TO service_role;

-- 5. HELPER FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at
            BEFORE UPDATE ON public.profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_games_updated_at') THEN
        CREATE TRIGGER update_games_updated_at
            BEFORE UPDATE ON public.games
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_game_users_updated_at') THEN
        CREATE TRIGGER update_game_users_updated_at
            BEFORE UPDATE ON public.game_users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_double_partners_updated_at') THEN
        CREATE TRIGGER update_double_partners_updated_at
            BEFORE UPDATE ON public.double_partners
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- 6. VERIFICATION
-- ========================================

SELECT 
    'Profiles table' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) as exists
UNION ALL
SELECT 
    'Games table',
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'games' AND table_schema = 'public'
    )
UNION ALL
SELECT 
    'Game users table',
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'game_users' AND table_schema = 'public'
    )
UNION ALL
SELECT 
    'Double partners table',
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'double_partners' AND table_schema = 'public'
    );

-- Show final message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DATABASE SETUP COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All tables created successfully';
    RAISE NOTICE '✅ Double partners table added';
    RAISE NOTICE '✅ No automatic triggers for user creation';
    RAISE NOTICE '✅ RLS disabled for development';
    RAISE NOTICE '✅ Full permissions granted';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for development!';
    RAISE NOTICE '================================';
END $$; 