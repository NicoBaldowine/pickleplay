-- Add avatar_url column to double_partners table
ALTER TABLE double_partners 
ADD COLUMN avatar_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN double_partners.avatar_url IS 'URL to partner avatar image stored in Supabase Storage';

-- Optional: Create an index if you plan to query by avatar_url frequently
-- CREATE INDEX idx_double_partners_avatar_url ON double_partners(avatar_url); 