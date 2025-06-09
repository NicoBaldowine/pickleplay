-- Add partner fields to game_users table
-- Execute this in Supabase Dashboard → SQL Editor

ALTER TABLE public.game_users 
ADD COLUMN IF NOT EXISTS partner_name TEXT,
ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.double_partners(id) ON DELETE SET NULL; 