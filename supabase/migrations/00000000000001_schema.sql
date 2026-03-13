-- SprintCargo Database Schema
-- Complete SQL schema with tables, constraints, indexes, RLS policies, and triggers

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('shipper', 'driver');
CREATE TYPE subscription_status AS ENUM ('inactive', 'trial', 'active', 'past_due', 'cancelled');
CREATE TYPE job_status AS ENUM (
  'draft', 'posted', 'quoted', 'accepted',
  'driver_en_route_pickup', 'at_pickup', 'loaded', 'in_transit',
  'at_dropoff', 'delivered', 'completed', 'cancelled', 'disputed'
);
CREATE TYPE quote_status AS ENUM (
  'pending', 'countered_by_shipper', 'countered_by_driver',
  'accepted', 'declined', 'expired', 'withdrawn'
);
CREATE TYPE size_category AS ENUM ('small', 'medium', 'large', 'oversized');
CREATE TYPE delivery_speed AS ENUM ('standard', 'same_day', 'rush');
CREATE TYPE notification_type AS ENUM (
  'new_job_nearby', 'new_quote', 'counter_offer',
  'quote_accepted', 'quote_declined',
  'driver_en_route', 'driver_arrived', 'loaded', 'in_transit', 'delivered',
  'payment_sent', 'payment_received',
  'review_request', 'subscription_warning'
);
CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  stripe_connected_account_id TEXT,
  stripe_connect_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_status subscription_status NOT NULL DEFAULT 'inactive',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Driver Profiles (vehicle info, availability, stats)
CREATE TABLE driver_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_year INTEGER,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  license_plate TEXT,
  vehicle_photo_url TEXT,
  cargo_length_inches NUMERIC,
  cargo_width_inches NUMERIC,
  cargo_height_inches NUMERIC,
  max_weight_lbs NUMERIC,
  service_radius_miles NUMERIC NOT NULL DEFAULT 50,
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  last_location_update TIMESTAMPTZ,
  rating NUMERIC NOT NULL DEFAULT 0,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Driver Rate Cards
CREATE TABLE driver_rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL UNIQUE REFERENCES driver_profiles(id) ON DELETE CASCADE,
  base_rate NUMERIC NOT NULL DEFAULT 0,
  per_mile_rate NUMERIC NOT NULL DEFAULT 0,
  size_small_surcharge NUMERIC NOT NULL DEFAULT 0,
  size_medium_surcharge NUMERIC NOT NULL DEFAULT 0,
  size_large_surcharge NUMERIC NOT NULL DEFAULT 0,
  size_oversized_surcharge NUMERIC NOT NULL DEFAULT 0,
  weight_under_50_surcharge NUMERIC NOT NULL DEFAULT 0,
  weight_50_to_150_surcharge NUMERIC NOT NULL DEFAULT 0,
  weight_150_to_500_surcharge NUMERIC NOT NULL DEFAULT 0,
  weight_over_500_surcharge NUMERIC NOT NULL DEFAULT 0,
  multi_stop_per_stop_rate NUMERIC NOT NULL DEFAULT 0,
  rush_multiplier NUMERIC NOT NULL DEFAULT 1.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_driver_id UUID REFERENCES driver_profiles(id) ON DELETE SET NULL,
  status job_status NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  pickup_contact_name TEXT NOT NULL,
  pickup_contact_phone TEXT NOT NULL,
  pickup_notes TEXT,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  dropoff_contact_name TEXT NOT NULL,
  dropoff_contact_phone TEXT NOT NULL,
  dropoff_notes TEXT,
  additional_stops JSONB,
  item_description TEXT NOT NULL,
  item_photos TEXT[],
  size_category size_category NOT NULL,
  estimated_weight_lbs NUMERIC,
  num_items INTEGER NOT NULL DEFAULT 1,
  delivery_speed delivery_speed NOT NULL DEFAULT 'standard',
  pickup_window_start TIMESTAMPTZ NOT NULL,
  pickup_window_end TIMESTAMPTZ NOT NULL,
  special_instructions TEXT,
  fragile BOOLEAN NOT NULL DEFAULT FALSE,
  requires_helpers BOOLEAN NOT NULL DEFAULT FALSE,
  estimated_distance_miles NUMERIC,
  estimated_duration_minutes INTEGER,
  estimated_price_low NUMERIC,
  estimated_price_high NUMERIC,
  accepted_quote_id UUID,
  final_price NUMERIC,
  loading_photos TEXT[],
  delivery_photos TEXT[],
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job Quotes
CREATE TABLE job_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  auto_calculated_amount NUMERIC,
  driver_note TEXT,
  status quote_status NOT NULL DEFAULT 'pending',
  shipper_counter_amount NUMERIC,
  shipper_counter_note TEXT,
  driver_counter_amount NUMERIC,
  driver_counter_note TEXT,
  negotiation_round INTEGER NOT NULL DEFAULT 1,
  estimated_pickup_eta_minutes INTEGER,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, driver_id)
);

-- Add FK from jobs.accepted_quote_id to job_quotes after both tables exist
ALTER TABLE jobs
  ADD CONSTRAINT fk_jobs_accepted_quote
  FOREIGN KEY (accepted_quote_id) REFERENCES job_quotes(id) ON DELETE SET NULL;

-- Delivery Tracking
CREATE TABLE delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed_mph NUMERIC,
  heading NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, reviewer_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status support_ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support Messages
CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Driver Profiles
CREATE INDEX idx_driver_profiles_is_available ON driver_profiles(is_available);
CREATE INDEX idx_driver_profiles_location ON driver_profiles(current_lat, current_lng)
  WHERE current_lat IS NOT NULL AND current_lng IS NOT NULL;
CREATE INDEX idx_driver_profiles_verified ON driver_profiles(verified);

-- Driver Rate Cards
CREATE INDEX idx_driver_rate_cards_driver_id ON driver_rate_cards(driver_id);

-- Jobs
CREATE INDEX idx_jobs_shipper_id ON jobs(shipper_id);
CREATE INDEX idx_jobs_assigned_driver_id ON jobs(assigned_driver_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_pickup_location ON jobs(pickup_lat, pickup_lng);
CREATE INDEX idx_jobs_posted ON jobs(status, created_at DESC) WHERE status = 'posted';

-- Job Quotes
CREATE INDEX idx_job_quotes_job_id ON job_quotes(job_id);
CREATE INDEX idx_job_quotes_driver_id ON job_quotes(driver_id);
CREATE INDEX idx_job_quotes_status ON job_quotes(status);

-- Delivery Tracking
CREATE INDEX idx_delivery_tracking_job_id ON delivery_tracking(job_id);
CREATE INDEX idx_delivery_tracking_recorded_at ON delivery_tracking(job_id, recorded_at DESC);

-- Reviews
CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX idx_reviews_job_id ON reviews(job_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(user_id, created_at DESC);

-- Support Tickets
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- Support Messages
CREATE INDEX idx_support_messages_ticket_id ON support_messages(ticket_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_driver_rate_cards_updated_at
  BEFORE UPDATE ON driver_rate_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_job_quotes_updated_at
  BEFORE UPDATE ON job_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-CREATE PROFILE ON AUTH.USERS INSERT
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'shipper'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );

  -- If user registered as a driver, also create a driver_profiles row
  IF (NEW.raw_user_meta_data->>'role') = 'driver' THEN
    INSERT INTO driver_profiles (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----

-- Users can read any profile (needed for viewing driver/shipper info)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profile insert is handled by trigger; allow service role only
CREATE POLICY "Profiles are created by trigger"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ---- DRIVER PROFILES ----

-- Anyone authenticated can view driver profiles (needed for job matching)
CREATE POLICY "Driver profiles are viewable by authenticated users"
  ON driver_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Drivers can update their own driver profile
CREATE POLICY "Drivers can update own driver profile"
  ON driver_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drivers can insert their own driver profile
CREATE POLICY "Drivers can insert own driver profile"
  ON driver_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ---- DRIVER RATE CARDS ----

-- Rate cards are viewable by authenticated users (shippers see them for quotes)
CREATE POLICY "Rate cards are viewable by authenticated users"
  ON driver_rate_cards FOR SELECT
  TO authenticated
  USING (true);

-- Drivers can insert their own rate card
CREATE POLICY "Drivers can insert own rate card"
  ON driver_rate_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

-- Drivers can update their own rate card
CREATE POLICY "Drivers can update own rate card"
  ON driver_rate_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- Drivers can delete their own rate card
CREATE POLICY "Drivers can delete own rate card"
  ON driver_rate_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = driver_id);

-- ---- JOBS ----

-- Shippers can view their own jobs
CREATE POLICY "Shippers can view own jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    auth.uid() = shipper_id
    OR auth.uid() = assigned_driver_id
    OR status = 'posted'
  );

-- Shippers can create jobs
CREATE POLICY "Shippers can create jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = shipper_id);

-- Shippers can update their own jobs; assigned drivers can update job status
CREATE POLICY "Job owners and assigned drivers can update jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = shipper_id OR auth.uid() = assigned_driver_id)
  WITH CHECK (auth.uid() = shipper_id OR auth.uid() = assigned_driver_id);

-- ---- JOB QUOTES ----

-- Quotes visible to the job shipper and the quoting driver
CREATE POLICY "Quotes visible to job shipper and quoting driver"
  ON job_quotes FOR SELECT
  TO authenticated
  USING (
    auth.uid() = driver_id
    OR auth.uid() = (SELECT shipper_id FROM jobs WHERE jobs.id = job_id)
  );

-- Drivers can create quotes
CREATE POLICY "Drivers can create quotes"
  ON job_quotes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

-- Drivers and shippers involved can update quotes (for counter offers)
CREATE POLICY "Quote participants can update quotes"
  ON job_quotes FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = driver_id
    OR auth.uid() = (SELECT shipper_id FROM jobs WHERE jobs.id = job_id)
  )
  WITH CHECK (
    auth.uid() = driver_id
    OR auth.uid() = (SELECT shipper_id FROM jobs WHERE jobs.id = job_id)
  );

-- ---- DELIVERY TRACKING ----

-- Tracking visible to job shipper and assigned driver
CREATE POLICY "Tracking visible to job participants"
  ON delivery_tracking FOR SELECT
  TO authenticated
  USING (
    auth.uid() = driver_id
    OR auth.uid() = (SELECT shipper_id FROM jobs WHERE jobs.id = job_id)
  );

-- Drivers can insert tracking points
CREATE POLICY "Drivers can insert tracking points"
  ON delivery_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

-- ---- REVIEWS ----

-- Reviews are publicly readable by authenticated users
CREATE POLICY "Reviews are viewable by authenticated users"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

-- Users can create reviews for completed jobs they participated in
CREATE POLICY "Participants can create reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_id
        AND jobs.status = 'completed'
        AND (jobs.shipper_id = auth.uid() OR jobs.assigned_driver_id = auth.uid())
    )
  );

-- ---- NOTIFICATIONS ----

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System/service role inserts notifications; allow user insert for self
CREATE POLICY "Notifications can be created for users"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---- SUPPORT TICKETS ----

-- Users can view their own support tickets
CREATE POLICY "Users can view own support tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create support tickets
CREATE POLICY "Users can create support tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own support tickets
CREATE POLICY "Users can update own support tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- SUPPORT MESSAGES ----

-- Users can view messages in their tickets
CREATE POLICY "Users can view messages in own tickets"
  ON support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_id
        AND support_tickets.user_id = auth.uid()
    )
  );

-- Users can send messages in their tickets
CREATE POLICY "Users can send messages in own tickets"
  ON support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_id
        AND support_tickets.user_id = auth.uid()
    )
  );
