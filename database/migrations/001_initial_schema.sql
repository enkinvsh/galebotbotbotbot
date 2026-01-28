-- Gallery Way TMA - Initial Schema
-- Run: psql $DATABASE_URL -f database/migrations/001_initial_schema.sql

-- Users table (Telegram users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    username VARCHAR(255),
    phone VARCHAR(20),
    language_code VARCHAR(10) DEFAULT 'ru',
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Admins table (Telegram-based admin auth)
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    admin_level INT DEFAULT 2, -- 1=head admin, 2=manager
    first_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_telegram_id ON admins(telegram_id);

-- Exhibitions table
CREATE TABLE IF NOT EXISTS exhibitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT DEFAULT 60,
    price INT NOT NULL, -- in rubles
    capacity INT DEFAULT 4, -- max people per time slot
    schedule_days INT[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=Sunday, 1=Monday, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exhibition_id INT NOT NULL REFERENCES exhibitions(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, completed, cancelled, no_show
    reminded_at TIMESTAMP WITH TIME ZONE, -- when reminder was sent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_exhibition_date_time ON bookings(exhibition_id, booking_date, booking_time);

-- Prevent overbooking: unique constraint per slot (but we allow multiple bookings up to capacity)
-- We'll check capacity in application logic instead

-- Seed exhibitions with Gallery Way data
INSERT INTO exhibitions (name, description, duration_minutes, price, capacity, schedule_days) VALUES
    ('Время жить', 'Мы можем годами строить жизнь, которая подходит всем — кроме нас самих.', 60, 1000, 4, ARRAY[0,1,2,3,4,5,6]),
    ('Сквозь страх', 'Свобода начинается там, где заканчивается страх.', 60, 1000, 3, ARRAY[0,1,2,3,4,5,6]),
    ('Мама, я тебя прощаю', 'Самая теплая и трогательная тема в проекте «Галерея Путь».', 60, 1000, 4, ARRAY[2,4,6]),
    ('Тело', 'Любовь к себе учит других любить тебя.', 60, 1000, 3, ARRAY[1,5]),
    ('Папа, давай поговорим', 'Каким он должен быть, или как принять, каким он не был?', 60, 1000, 4, ARRAY[0,3])
ON CONFLICT DO NOTHING;

-- Seed head admin
INSERT INTO admins (telegram_id, admin_level, first_name) VALUES
    (468130024, 1, 'Head Admin')
ON CONFLICT (telegram_id) DO NOTHING;

-- Helper function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
