-- Booking System (Calendly-style) Migration
-- Run with: npx prisma db execute --file prisma/migrations/booking_system.sql

-- Create enum for booking appointment status
DO $$ BEGIN
    CREATE TYPE booking_appointment_status AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create booking_types table
CREATE TABLE IF NOT EXISTS booking_types (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agency_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    duration INT NOT NULL DEFAULT 30,
    color TEXT DEFAULT '#76527c',
    buffer_before INT NOT NULL DEFAULT 0,
    buffer_after INT NOT NULL DEFAULT 15,
    min_notice INT NOT NULL DEFAULT 24,
    max_future_days INT NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    location_type TEXT NOT NULL DEFAULT 'VIDEO',
    location_details TEXT,
    auto_create_meet BOOLEAN NOT NULL DEFAULT TRUE,
    assignment_type TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
    specific_user_id TEXT,
    questions JSONB DEFAULT '[]',
    created_at TIMESTAMP(6) DEFAULT NOW(),
    updated_at TIMESTAMP(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_types_agency ON booking_types(agency_id);
CREATE INDEX IF NOT EXISTS idx_booking_types_slug ON booking_types(slug);
CREATE INDEX IF NOT EXISTS idx_booking_types_active ON booking_types(is_active);

-- Create booking_type_users table (for round-robin/multiple hosts)
CREATE TABLE IF NOT EXISTS booking_type_users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    booking_type_id TEXT NOT NULL REFERENCES booking_types(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) DEFAULT NOW(),
    UNIQUE(booking_type_id, user_id)
);

-- Create agency_availability table
CREATE TABLE IF NOT EXISTS agency_availability (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agency_id TEXT UNIQUE NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Dubai',
    weekly_schedule JSONB NOT NULL DEFAULT '{
        "monday": [{"start": "09:00", "end": "18:00"}],
        "tuesday": [{"start": "09:00", "end": "18:00"}],
        "wednesday": [{"start": "09:00", "end": "18:00"}],
        "thursday": [{"start": "09:00", "end": "18:00"}],
        "friday": [{"start": "09:00", "end": "18:00"}],
        "saturday": [],
        "sunday": []
    }',
    created_at TIMESTAMP(6) DEFAULT NOW(),
    updated_at TIMESTAMP(6) DEFAULT NOW()
);

-- Create user_availability table
CREATE TABLE IF NOT EXISTS user_availability (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Dubai',
    use_custom_schedule BOOLEAN NOT NULL DEFAULT FALSE,
    weekly_schedule JSONB NOT NULL DEFAULT '{}',
    date_overrides JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP(6) DEFAULT NOW(),
    updated_at TIMESTAMP(6) DEFAULT NOW()
);

-- Create booking_appointments table
CREATE TABLE IF NOT EXISTS booking_appointments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agency_id TEXT NOT NULL,
    booking_type_id TEXT NOT NULL REFERENCES booking_types(id),
    host_user_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    guest_company TEXT,
    client_id TEXT,
    start_time TIMESTAMP(6) NOT NULL,
    end_time TIMESTAMP(6) NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Dubai',
    status booking_appointment_status NOT NULL DEFAULT 'SCHEDULED',
    cancelled_at TIMESTAMP(6),
    cancelled_by TEXT,
    cancellation_reason TEXT,
    meeting_link TEXT,
    meeting_id TEXT,
    calendar_event_id TEXT,
    location TEXT,
    notes TEXT,
    form_responses JSONB DEFAULT '{}',
    reminder_sent_at TIMESTAMP(6),
    created_at TIMESTAMP(6) DEFAULT NOW(),
    updated_at TIMESTAMP(6) DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_appointments_agency ON booking_appointments(agency_id);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_type ON booking_appointments(booking_type_id);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_host ON booking_appointments(host_user_id);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_client ON booking_appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_status ON booking_appointments(status);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_start ON booking_appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_booking_appointments_guest_email ON booking_appointments(guest_email);

-- Seed default booking type for existing agencies
INSERT INTO booking_types (agency_id, name, slug, description, duration, color)
SELECT
    id,
    '30-min Discovery Call',
    CONCAT(COALESCE(slug, 'agency'), '-discovery'),
    'A quick call to discuss your needs and how we can help.',
    30,
    '#76527c'
FROM agencies
WHERE NOT EXISTS (
    SELECT 1 FROM booking_types WHERE agency_id = agencies.id
)
ON CONFLICT (slug) DO NOTHING;

-- Seed agency availability for existing agencies
INSERT INTO agency_availability (agency_id)
SELECT id FROM agencies
WHERE NOT EXISTS (
    SELECT 1 FROM agency_availability WHERE agency_id = agencies.id
);

COMMENT ON TABLE booking_types IS 'Meeting types available for booking (like Calendly event types)';
COMMENT ON TABLE booking_appointments IS 'Scheduled appointments/bookings';
COMMENT ON TABLE agency_availability IS 'Default availability hours for the agency';
COMMENT ON TABLE user_availability IS 'Per-user availability overrides';
