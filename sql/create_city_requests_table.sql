-- Create city_requests table to track user city requests for app expansion
CREATE TABLE IF NOT EXISTS city_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name VARCHAR NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_city_requests_city_name ON city_requests(city_name);
CREATE INDEX IF NOT EXISTS idx_city_requests_created_at ON city_requests(created_at);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE city_requests ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert city requests (for anonymous users during onboarding)
CREATE POLICY "Allow city request insertion" ON city_requests FOR INSERT WITH CHECK (true);

-- Policy to allow users to view their own requests
CREATE POLICY "Users can view own city requests" ON city_requests FOR SELECT 
USING (requested_by = auth.uid() OR requested_by IS NULL);

-- Policy for admin/analytics access (you can modify this based on your admin setup)
-- CREATE POLICY "Admin can view all city requests" ON city_requests FOR SELECT 
-- USING (auth.jwt() ->> 'role' = 'admin'); 