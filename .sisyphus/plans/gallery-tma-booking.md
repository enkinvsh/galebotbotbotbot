# Gallery Way - Telegram Mini App Booking System

## TL;DR

> **Quick Summary**: Build a complete production-ready Telegram Mini App to replace rubitime.ru widget for Gallery Way exhibition bookings. System includes TMA frontend, Express backend, PostgreSQL database, and bot messaging.
> 
> **Deliverables**:
> - Telegram bot configured with Mini App
> - React/TypeScript TMA booking interface
> - Node.js/Express backend API
> - PostgreSQL database with complete schema
> - Bot messaging (confirmations, reminders)
> - Admin interface for booking management
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Bot Setup → Database Schema → Backend API → TMA Frontend → Bot Messaging

---

## Context

### Original Request
Create Telegram Mini App (TMA) for Gallery Way exhibition bookings to replace current rubitime.ru widget. System needs booking form in Telegram, SQL database for tracking, and Telegram communication for confirmations/reminders.

### Business Details
**Client**: Gallery Way (gallery-way.ru) - psychological immersive exhibitions in darkness, Saint Petersburg

**Current exhibitions**:
- "Время жить" - 1000₽, 50-60 min
- "Сквозь страх" - 1000₽, 50-60 min  
- "Мама, я тебя прощаю" - 1000₽, 50-60 min (вторник, четверг, суббота)
- "Тело" - 1000₽, 50-60 min (понедельник, пятница)
- "Папа, давай поговорим" - 1000₽, 50-60 min (среда, воскресенье)

**Location**: СПб, ул. Гороховая 49 лит Б, пространство "SENO", 2 этаж  
**Hours**: ежедневно 12:00-21:00  
**Contact**: +7 981 124 5511, @galleryway

### Technical Stack (From Research)
- **Frontend**: React + TypeScript + @telegram-apps/sdk
- **Backend**: Node.js/Express + @tma.js/init-data-node
- **Database**: PostgreSQL
- **Bot Framework**: node-telegram-bot-api or grammy

---

## Work Objectives

### Core Objective
Build a complete Telegram Mini App booking system that allows Gallery Way visitors to book exhibitions directly through Telegram, with automated confirmations and reminders.

### Concrete Deliverables
- Telegram bot registered with Mini App URL
- React TMA at `/frontend/` with exhibition selection, date/time picker, booking form
- Express API at `/backend/` with InitData validation, booking CRUD, admin endpoints
- PostgreSQL database with users, exhibitions, bookings, time_slots tables
- Bot message handlers for confirmations and reminders
- Admin interface for viewing/managing bookings

### Definition of Done
- [ ] User can open TMA from bot, select exhibition, choose date/time, submit booking
- [ ] User receives immediate confirmation message in Telegram
- [ ] User receives reminder 24h before booking
- [ ] Admin can view all bookings and manage them
- [ ] Database prevents double-booking for same time slot
- [ ] All verification commands pass (see Verification Strategy)

### Must Have
- InitData validation (security - verify requests come from Telegram)
- Phone number collection for contact
- Booking status flow (pending → confirmed → completed/cancelled)
- **Time slot capacity: 3-4 people max per slot (varies by exhibition)**
- Moscow timezone (Europe/Moscow) for Saint Petersburg
- Exhibition schedule constraints (specific days per exhibition)
- **Admin auth via Telegram ID (store head admin ID in env, level-based system)**

### Must NOT Have (Guardrails)
- **NO payment integration** - this is booking only, payment happens on-site
- **NO analytics/tracking** - focus on core booking functionality
- **NO review/rating system** - out of scope
- **NO multi-language support** - Russian only for MVP
- **NO fancy animations** - simple, functional UI
- **NO AI-generated placeholder content** - use actual Gallery Way data
- **NO complex admin dashboard** - simple list view is sufficient

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (greenfield project)
- **User wants tests**: NO - Manual verification only (user will test to speed up implementation)
- **Framework**: N/A (no automated tests)

### Manual Verification Procedures

> All verification must be executable by agents without user intervention.

**For TMA Frontend** (using chrome-devtools browser automation):
```
1. Open bot via Telegram Web
2. Click Mini App button
3. Agent navigates TMA UI, selects exhibition, date, time
4. Fills phone number
5. Clicks "Book"
6. Screenshot: .sisyphus/evidence/booking-flow-complete.png
7. Assert: "Booking confirmed" message appears
```

**For Backend API** (using Bash curl):
```bash
# Create booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "X-Telegram-Init-Data: [test-init-data]" \
  -d '{
    "exhibition_id": 1,
    "booking_date": "2026-02-01",
    "booking_time": "14:00",
    "phone": "+79811245511"
  }' | jq '.id'
# Assert: Returns booking ID
# Assert: HTTP 201

# Get bookings
curl http://localhost:3000/api/admin/bookings | jq 'length'
# Assert: Returns number > 0
```

**For Bot Messaging** (using Bash):
```bash
# Trigger confirmation send
node backend/scripts/test-send-confirmation.js --booking-id=1
# Assert: Exit code 0
# Assert: Console shows "Message sent to user [telegram_id]"
```

**For Database** (using Bash psql):
```bash
psql -U gallery_user -d gallery_db -c "SELECT COUNT(*) FROM bookings WHERE status='confirmed';"
# Assert: Returns count
# Assert: Exit code 0
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - Setup):
├── Task 1: Bot setup via @BotFather
├── Task 2: Initialize project structure
└── Task 3: PostgreSQL database setup

Wave 2 (After Wave 1 - Core Infrastructure):
├── Task 4: Database schema implementation
└── Task 5: Backend project setup with Express

Wave 3 (After Wave 2 - API & Frontend):
├── Task 6: Backend API - User & Exhibition endpoints
├── Task 7: Backend API - Booking endpoints
├── Task 8: Frontend TMA - Project setup
└── Task 9: Frontend TMA - Exhibition list UI

Wave 4 (After Wave 3 - Integration):
├── Task 10: Frontend TMA - Date/time picker
├── Task 11: Frontend TMA - Booking form & submission
├── Task 12: Bot messaging - Confirmation handler
└── Task 13: Bot messaging - Reminder scheduler

Wave 5 (After Wave 4 - Admin & Final):
├── Task 14: Admin endpoints - View bookings
├── Task 15: Admin endpoints - Manage bookings
└── Task 16: Integration testing & deployment prep
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 8, 12 | 2, 3 |
| 2 | None | 4, 5 | 1, 3 |
| 3 | None | 4 | 1, 2 |
| 4 | 2, 3 | 6, 7 | 5 |
| 5 | 2 | 6, 7 | 4 |
| 6 | 4, 5 | 9, 10 | 7, 8, 9 |
| 7 | 4, 5 | 10, 11 | 6, 8, 9 |
| 8 | 1 | 9, 10, 11 | 6, 7, 9 |
| 9 | 8, 6 | 10, 11 | None |
| 10 | 9, 7 | 11 | None |
| 11 | 10 | 12, 13 | None |
| 12 | 11, 1 | None | 13, 14, 15 |
| 13 | 11, 1 | None | 12, 14, 15 |
| 14 | 7 | None | 12, 13, 15 |
| 15 | 7 | None | 12, 13, 14 |
| 16 | 12, 13, 14, 15 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Categories |
|------|-------|----------------------|
| 1 | 1, 2, 3 | quick (bot setup), unspecified-low (structure), unspecified-low (db) |
| 2 | 4, 5 | unspecified-low (schema), unspecified-low (express setup) |
| 3 | 6, 7, 8, 9 | unspecified-high (API), unspecified-high (API), visual-engineering (TMA), visual-engineering (UI) |
| 4 | 10, 11, 12, 13 | visual-engineering (picker), visual-engineering (form), unspecified-high (bot), unspecified-high (scheduler) |
| 5 | 14, 15, 16 | unspecified-high (admin), unspecified-high (admin), ultrabrain (integration) |

---

## TODOs

### Wave 1: Setup (Parallel)

- [ ] 1. Bot Setup via @BotFather

  **What to do**:
  - Create new Telegram bot via @BotFather
  - Save bot token to environment variable
  - Register Mini App URL (will be provided after frontend deployment)
  - Configure bot commands (/start, /mybookings)
  - Set bot description and about text in Russian

  **Must NOT do**:
  - Don't create payment handler (out of scope)
  - Don't set up webhook yet (polling is fine for MVP)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple administrative task, minimal code, just bot registration
  - **Skills**: None needed (straightforward BotFather interaction)
  - **Skills Evaluated but Omitted**:
    - `dev-browser`: Could use but manual BotFather interaction is simpler

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 8, 12, 13 (need bot token)
  - **Blocked By**: None (can start immediately)

  **References**:
  - Official docs: https://core.telegram.org/bots#6-botfather - Bot creation steps
  - Official docs: https://core.telegram.org/bots/webapps#implementing-mini-apps - Mini App registration

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Verify bot token exists
  [ -n "$TELEGRAM_BOT_TOKEN" ]
  # Assert: Exit code 0
  
  # Test bot API
  curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq '.ok'
  # Assert: Returns "true"
  ```

  **Evidence to Capture**:
  - [ ] Terminal output showing bot creation
  - [ ] .env file with TELEGRAM_BOT_TOKEN set
  - [ ] getMe API response showing bot details

  **Commit**: YES
  - Message: `feat(bot): create Telegram bot via BotFather`
  - Files: `.env.example`, `docs/bot-setup.md`
  - Pre-commit: None

---

- [ ] 2. Initialize Project Structure

  **What to do**:
  - Create root directory structure: `/frontend`, `/backend`, `/database`
  - Initialize package.json for monorepo (or separate packages)
  - Add .gitignore (node_modules, .env, dist)
  - Create .env.example with required environment variables
  - Add README.md with project overview

  **Must NOT do**:
  - Don't install dependencies yet (next tasks will do that)
  - Don't create excessive folder nesting

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Scaffolding task, quick setup, no complex logic
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: No specialized domain knowledge needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 5, 6, 7, 8
  - **Blocked By**: None (can start immediately)

  **References**:
  - Example structure: https://github.com/Telegram-Mini-Apps - Common TMA project patterns

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Verify directory structure
  [ -d "frontend" ] && [ -d "backend" ] && [ -d "database" ]
  # Assert: Exit code 0
  
  # Verify files exist
  [ -f "package.json" ] && [ -f ".gitignore" ] && [ -f "README.md" ] && [ -f ".env.example" ]
  # Assert: Exit code 0
  
  # Check .env.example has required vars
  grep -q "TELEGRAM_BOT_TOKEN" .env.example && grep -q "DATABASE_URL" .env.example
  # Assert: Exit code 0
  ```

  **Evidence to Capture**:
  - [ ] `tree -L 2` output showing structure
  - [ ] `.env.example` contents

  **Commit**: YES
  - Message: `chore: initialize project structure`
  - Files: `package.json`, `.gitignore`, `README.md`, `.env.example`, folder structure
  - Pre-commit: None

---

- [ ] 3. PostgreSQL Database Setup

  **What to do**:
  - Install PostgreSQL (or use Docker container)
  - Create database: `gallery_db`
  - Create database user: `gallery_user` with password
  - Grant privileges to gallery_user
  - Add connection string to .env
  - Test connection

  **Must NOT do**:
  - Don't create tables yet (Task 4 will do that)
  - Don't use default postgres user in production

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Standard database setup, well-documented process
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Database setup is straightforward

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 4 (schema creation)
  - **Blocked By**: None (can start immediately)

  **References**:
  - PostgreSQL docs: https://www.postgresql.org/docs/current/tutorial-createdb.html - Database creation
  - Docker option: https://hub.docker.com/_/postgres - PostgreSQL container setup

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Test database connection
  psql "$DATABASE_URL" -c "SELECT version();"
  # Assert: Exit code 0
  # Assert: Output contains "PostgreSQL"
  
  # Verify database exists
  psql "$DATABASE_URL" -c "SELECT current_database();"
  # Assert: Returns "gallery_db"
  ```

  **Evidence to Capture**:
  - [ ] Connection test output
  - [ ] Database version info

  **Commit**: YES
  - Message: `feat(db): setup PostgreSQL database`
  - Files: `database/setup.sql`, `.env` (add to .gitignore)
  - Pre-commit: None

---

### Wave 2: Core Infrastructure (After Wave 1)

- [ ] 4. Database Schema Implementation

  **What to do**:
  - Create migration file: `001_initial_schema.sql`
  - Implement tables: `users`, `exhibitions`, `bookings`, `time_slots`, `admins`
  - Add `capacity` column to exhibitions table (3-4 depending on exhibition)
  - Add `admin_level` column to admins table (1=head admin, 2=manager, etc.)
  - Add indexes for performance (telegram_id, booking_date, exhibition_id)
  - Add constraints (foreign keys, unique constraints for double-booking prevention)
  - Seed exhibitions table with 5 Gallery Way exhibitions + capacity values
  - Seed admins table with head admin Telegram ID from env
  - Run migration and verify

  **Must NOT do**:
  - Don't add unnecessary columns (keep it minimal)
  - Don't create views or stored procedures yet

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Schema design based on provided pattern, straightforward SQL
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Standard database schema implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 5)
  - **Blocks**: Tasks 6, 7 (API needs schema)
  - **Blocked By**: Tasks 2, 3 (needs project structure and database)

  **References**:
  - User-provided schema pattern:
    ```sql
    CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        first_name VARCHAR(255),
        username VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        exhibition_id INT REFERENCES exhibitions(id),
        booking_date DATE NOT NULL,
        booking_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
    );
    ```
  - Exhibition data (from context) with capacity:
    - "Время жить" - daily, capacity: 4
    - "Сквозь страх" - daily, capacity: 3
    - "Мама, я тебя прощаю" - вторник, четверг, суббота, capacity: 4
    - "Тело" - понедельник, пятница, capacity: 3
    - "Папа, давай поговорим" - среда, воскресенье, capacity: 4
  - Admins table structure:
    ```sql
    CREATE TABLE admins (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        admin_level INT DEFAULT 1,
        first_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
    );
    ```

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Run migration
  psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql
  # Assert: Exit code 0
  
  # Verify tables exist
  psql "$DATABASE_URL" -c "\dt" | grep -E "(users|exhibitions|bookings|time_slots)"
  # Assert: All 4 tables listed
  
  # Verify exhibitions seeded with capacity
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM exhibitions;"
  # Assert: Returns "5"
  
  # Verify capacity values set
  psql "$DATABASE_URL" -c "SELECT name, capacity FROM exhibitions;"
  # Assert: All exhibitions have capacity 3 or 4
  
  # Verify admins table exists
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM admins WHERE admin_level=1;"
  # Assert: Returns "1" (head admin)
  
  # Verify indexes exist
  psql "$DATABASE_URL" -c "\di" | grep -E "(users_telegram_id|bookings_date)"
  # Assert: Indexes listed
  ```

  **Evidence to Capture**:
  - [ ] Migration execution output
  - [ ] Table descriptions (\d users, \d bookings, etc.)
  - [ ] Seeded exhibitions data

  **Commit**: YES
  - Message: `feat(db): implement database schema with Gallery Way exhibitions`
  - Files: `database/migrations/001_initial_schema.sql`
  - Pre-commit: `psql "$DATABASE_URL" -f database/migrations/001_initial_schema.sql` (dry run)

---

- [ ] 5. Backend Project Setup with Express

  **What to do**:
  - Initialize Node.js project in `/backend`
  - Install dependencies: express, pg, @tma.js/init-data-node, dotenv, cors
  - Create `src/index.ts` with Express server skeleton
  - Setup TypeScript configuration
  - Create middleware: initDataValidator, errorHandler
  - Create database connection pool
  - Add start script: `tsx src/index.ts` or `ts-node src/index.ts`

  **Must NOT do**:
  - Don't implement routes yet (Tasks 6, 7 will do that)
  - Don't add unnecessary middleware (logging, compression, etc.)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Standard Express setup, well-documented
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Backend scaffolding is straightforward

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Tasks 6, 7, 14, 15 (API implementation)
  - **Blocked By**: Task 2 (needs project structure)

  **References**:
  - @tma.js/init-data-node docs: https://docs.telegram-mini-apps.com/packages/tma-js-init-data-node - InitData validation
  - Express + TypeScript setup: https://github.com/microsoft/TypeScript-Node-Starter - Example setup pattern
  - node-postgres: https://node-postgres.com/ - Database connection pool

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Verify dependencies installed
  cd backend && [ -f "package.json" ] && grep -q "express" package.json
  # Assert: Exit code 0
  
  # Check TypeScript compiles
  cd backend && npx tsc --noEmit
  # Assert: Exit code 0
  
  # Start server (background) and test health endpoint
  cd backend && npm start &
  sleep 3
  curl -s http://localhost:3000/health | jq '.status'
  # Assert: Returns "ok"
  pkill -f "npm start"
  ```

  **Evidence to Capture**:
  - [ ] package.json dependencies list
  - [ ] Server startup log
  - [ ] Health check response

  **Commit**: YES
  - Message: `feat(backend): setup Express server with TypeScript and InitData validation`
  - Files: `backend/package.json`, `backend/src/index.ts`, `backend/tsconfig.json`, middleware files
  - Pre-commit: `cd backend && npx tsc --noEmit`

---

### Wave 3: API & Frontend Foundation (After Wave 2)

- [ ] 6. Backend API - User & Exhibition Endpoints

  **What to do**:
  - Create `src/routes/users.ts`: POST /api/users (upsert user from InitData)
  - Create `src/routes/exhibitions.ts`: GET /api/exhibitions (list all with schedule)
  - Implement user upsert logic: find by telegram_id, create if not exists, update otherwise
  - Add InitData validation middleware to both routes
  - Return JSON responses with proper status codes

  **Must NOT do**:
  - Don't add user profile editing (out of scope)
  - Don't add exhibition CRUD (exhibitions are seeded, read-only for MVP)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: API implementation requires careful validation and database interaction
  - **Skills**: None needed (standard REST API)
  - **Skills Evaluated but Omitted**:
    - All skills: No specialized domain knowledge needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9)
  - **Blocks**: Tasks 9, 10, 11 (TMA needs exhibition data)
  - **Blocked By**: Tasks 4, 5 (needs schema and Express)

  **References**:
  - InitData structure: https://docs.telegram-mini-apps.com/platform/init-data#parameters - telegram_id, first_name, username fields
  - Database schema from Task 4: users table structure
  - node-postgres query pattern: https://node-postgres.com/features/queries - Parameterized queries

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Test exhibition list endpoint
  curl -s http://localhost:3000/api/exhibitions | jq 'length'
  # Assert: Returns 5
  
  # Test user upsert (with mock InitData header)
  curl -s -X POST http://localhost:3000/api/users \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456%2C%22first_name%22%3A%22Test%22%7D" \
    | jq '.id'
  # Assert: Returns user ID
  
  # Verify user in database
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users WHERE telegram_id=123456;"
  # Assert: Returns "1"
  ```

  **Evidence to Capture**:
  - [ ] GET /api/exhibitions response
  - [ ] POST /api/users response
  - [ ] Database query showing created user

  **Commit**: YES
  - Message: `feat(api): implement user and exhibition endpoints`
  - Files: `backend/src/routes/users.ts`, `backend/src/routes/exhibitions.ts`
  - Pre-commit: `cd backend && npx tsc --noEmit`

---

- [ ] 7. Backend API - Booking Endpoints

  **What to do**:
  - Create `src/routes/bookings.ts`
  - POST /api/bookings: Create booking (validate time slot availability, prevent overbooking)
  - GET /api/bookings/my: Get user's bookings (from InitData telegram_id)
  - GET /api/bookings/availability: Check available slots for exhibition + date
  - PATCH /api/bookings/:id/cancel: Cancel booking (set status to 'cancelled')
  - Implement availability check: query bookings count for same exhibition_id + date + time, compare against exhibition capacity
  - **Capacity logic**: COUNT(bookings) < exhibitions.capacity for that slot

  **Must NOT do**:
  - Don't implement payment processing
  - Don't add booking modification (reschedule) - cancellation only for MVP

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex logic with race condition prevention, transaction handling needed
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Standard database transaction patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 8, 9)
  - **Blocks**: Tasks 10, 11, 14, 15 (booking UI and admin depend on this)
  - **Blocked By**: Tasks 4, 5 (needs schema and Express)

  **References**:
  - Database schema from Task 4: bookings table structure
  - Capacity check pattern (per-exhibition capacity from database):
    ```sql
    SELECT COUNT(b.*) as booked, e.capacity
    FROM bookings b
    JOIN exhibitions e ON b.exhibition_id = e.id
    WHERE b.exhibition_id = $1 AND b.booking_date = $2 AND b.booking_time = $3 
      AND b.status != 'cancelled'
    GROUP BY e.capacity
    -- Then check: if booked >= capacity, reject booking
    ```
  - Transaction example: https://node-postgres.com/features/transactions - Use BEGIN/COMMIT for atomicity

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Create booking
  BOOKING_ID=$(curl -s -X POST http://localhost:3000/api/bookings \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456%7D" \
    -H "Content-Type: application/json" \
    -d '{
      "exhibition_id": 1,
      "booking_date": "2026-02-15",
      "booking_time": "14:00",
      "phone": "+79811245511"
    }' | jq -r '.id')
  echo "Booking ID: $BOOKING_ID"
  # Assert: BOOKING_ID is not empty
  
  # Test capacity limit (fill slot to capacity)
  # Create 2nd and 3rd bookings for same slot (capacity is 3-4)
  for i in {2..4}; do
    curl -s -X POST http://localhost:3000/api/bookings \
      -H "X-Telegram-Init-Data: user=%7B%22id%22%3A${i}00000%7D" \
      -H "Content-Type: application/json" \
      -d "{
        \"exhibition_id\": 1,
        \"booking_date\": \"2026-02-15\",
        \"booking_time\": \"14:00\",
        \"phone\": \"+7999999999$i\"
      }"
  done
  
  # Try to book 5th person (should fail if capacity is 4)
  curl -s -X POST http://localhost:3000/api/bookings \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A500000%7D" \
    -H "Content-Type: application/json" \
    -d '{
      "exhibition_id": 1,
      "booking_date": "2026-02-15",
      "booking_time": "14:00",
      "phone": "+79999999995"
    }' | jq '.error'
  # Assert: Returns error about slot being full (if capacity reached)
  
  # Test availability endpoint
  curl -s "http://localhost:3000/api/bookings/availability?exhibition_id=1&date=2026-02-15" \
    | jq '.slots[] | select(.time=="14:00") | .available'
  # Assert: Returns false or available_count=0
  
  # Get user bookings
  curl -s http://localhost:3000/api/bookings/my \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456%7D" \
    | jq 'length'
  # Assert: Returns 1
  
  # Cancel booking
  curl -s -X PATCH http://localhost:3000/api/bookings/$BOOKING_ID/cancel \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456%7D" \
    | jq '.status'
  # Assert: Returns "cancelled"
  ```

  **Evidence to Capture**:
  - [ ] Booking creation response
  - [ ] Double-booking error response
  - [ ] User bookings list
  - [ ] Cancellation response

  **Commit**: YES
  - Message: `feat(api): implement booking endpoints with double-booking prevention`
  - Files: `backend/src/routes/bookings.ts`
  - Pre-commit: `cd backend && npx tsc --noEmit`

---

- [ ] 8. Frontend TMA - Project Setup

  **What to do**:
  - Initialize React + TypeScript project in `/frontend` (using Vite)
  - Install dependencies: @telegram-apps/sdk-react, react-router-dom
  - Setup Telegram Web App SDK initialization
  - Create layout component with Telegram theme support
  - Configure Vite for TMA (public path, build settings)
  - Add proxy to backend API in vite.config.ts

  **Must NOT do**:
  - Don't add complex state management (Context API is sufficient)
  - Don't add UI library (use native Telegram components)
  - Don't create pages yet (Task 9 will do that)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: TMA involves UI/UX considerations with Telegram design patterns
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: TMA requires understanding of Telegram's design system and user expectations
  - **Skills Evaluated but Omitted**:
    - `playwright`, `dev-browser`: Testing skills, not needed for setup

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 6, 7, 9)
  - **Blocks**: Tasks 9, 10, 11 (UI pages depend on setup)
  - **Blocked By**: Task 1 (needs bot token for SDK init)

  **References**:
  - @telegram-apps/sdk-react docs: https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk-react - Initialization and hooks
  - Vite setup: https://vitejs.dev/guide/ - React + TypeScript template
  - TMA design guidelines: https://core.telegram.org/bots/webapps#design-guidelines - UI/UX patterns

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Verify dependencies installed
  cd frontend && [ -f "package.json" ] && grep -q "@telegram-apps/sdk-react" package.json
  # Assert: Exit code 0
  
  # Check TypeScript compiles
  cd frontend && npx tsc --noEmit
  # Assert: Exit code 0
  
  # Build succeeds
  cd frontend && npm run build
  # Assert: Exit code 0
  # Assert: dist/ directory created
  
  # Dev server starts
  cd frontend && npm run dev &
  sleep 3
  curl -s http://localhost:5173 | grep -q "<!DOCTYPE html>"
  # Assert: Exit code 0
  pkill -f "npm run dev"
  ```

  **Evidence to Capture**:
  - [ ] package.json dependencies
  - [ ] Build output
  - [ ] Dev server running

  **Commit**: YES
  - Message: `feat(frontend): setup TMA React project with Telegram SDK`
  - Files: `frontend/package.json`, `frontend/src/`, `frontend/vite.config.ts`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [ ] 9. Frontend TMA - Exhibition List UI

  **What to do**:
  - Create ExhibitionList component
  - Fetch exhibitions from GET /api/exhibitions
  - Display exhibition cards: name, description, duration, price, schedule
  - Add exhibition selection handler (navigate to booking flow)
  - Style with Telegram-native design (buttons, cards, colors from theme)
  - Handle loading and error states

  **Must NOT do**:
  - Don't add search/filter (5 exhibitions only, not needed)
  - Don't add exhibition images (keep simple)
  - Don't add fancy animations

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with design considerations
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Need to design clear, usable exhibition list following Telegram patterns
  - **Skills Evaluated but Omitted**:
    - `playwright`, `dev-browser`: Testing, not implementation

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Task 8)
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 10, 11 (booking flow starts from exhibition selection)
  - **Blocked By**: Tasks 8, 6 (needs TMA setup and exhibition API)

  **References**:
  - Task 6 API response structure: GET /api/exhibitions
  - Exhibition data (from context):
    ```
    {
      "id": 1,
      "name": "Время жить",
      "price": 1000,
      "duration": "50-60 мин",
      "schedule": "ежедневно"
    }
    ```
  - Telegram UI components: https://core.telegram.org/bots/webapps#themeparams - Use theme colors
  - React patterns for data fetching: https://react.dev/learn/synchronizing-with-effects - useEffect for API calls

  **Acceptance Criteria**:
  
  **Automated Verification** (using chrome-devtools):
  ```
  # Agent executes via browser automation:
  1. Navigate to: http://localhost:5173 (TMA running in dev)
  2. Wait for: selector ".exhibition-card" to appear
  3. Count elements: .exhibition-card
  4. Assert: Count equals 5
  5. Screenshot: .sisyphus/evidence/task-9-exhibition-list.png
  6. Click: first .exhibition-card
  7. Assert: URL changes to /booking or booking flow starts
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of exhibition list
  - [ ] Console log showing API fetch success
  - [ ] Component render in browser

  **Commit**: YES
  - Message: `feat(frontend): implement exhibition list UI`
  - Files: `frontend/src/components/ExhibitionList.tsx`, styles
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

### Wave 4: Booking Flow & Messaging (After Wave 3)

- [ ] 10. Frontend TMA - Date/Time Picker

  **What to do**:
  - Create DateTimePicker component
  - Show calendar for date selection (disable past dates)
  - Show time slots for selected date (12:00-21:00, 60-min intervals)
  - Filter time slots by exhibition schedule (e.g., "Мама, я тебя прощаю" only вторник, четверг, суббота)
  - Highlight available vs fully booked slots (fetch from backend - [ENDPOINT NEEDED])
  - Save selected date/time to booking state

  **Must NOT do**:
  - Don't build custom calendar from scratch (use date-fns or simple input type="date")
  - Don't add timezone selector (always Europe/Moscow)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Interactive UI component with complex user interaction
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Date/time picker UX is critical for booking flow success
  - **Skills Evaluated but Omitted**:
    - `playwright`: Testing, not implementation

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Task 9)
  - **Parallel Group**: Sequential
  - **Blocks**: Task 11 (booking form needs date/time)
  - **Blocked By**: Tasks 9, 7 (needs exhibition selection and booking API)

  **References**:
  - Exhibition schedules from Task 4 seed data
  - Date handling: https://date-fns.org/ - For date manipulation and formatting
  - Time slot logic:
    ```javascript
    // Generate slots: 12:00, 13:00, ..., 21:00
    const slots = Array.from({length: 10}, (_, i) => `${12+i}:00`);
    ```
  - Availability endpoint (needs to be added to Task 7): GET /api/bookings/availability?exhibition_id=1&date=2026-02-15

  **Acceptance Criteria**:
  
  **Automated Verification** (using chrome-devtools):
  ```
  # Agent executes via browser automation:
  1. Navigate to: booking flow (after selecting exhibition)
  2. Wait for: date picker to appear
  3. Select date: 15 days from now (future date)
  4. Assert: Time slots appear
  5. Count elements: .time-slot
  6. Assert: Count >= 8 (at least some slots shown)
  7. Click: first available slot
  8. Assert: Slot becomes selected (visual change)
  9. Screenshot: .sisyphus/evidence/task-10-datetime-picker.png
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of date picker
  - [ ] Screenshot of time slots
  - [ ] Selected date/time in component state (console log)

  **Commit**: YES
  - Message: `feat(frontend): implement date/time picker with availability check`
  - Files: `frontend/src/components/DateTimePicker.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [ ] 11. Frontend TMA - Booking Form & Submission

  **What to do**:
  - Create BookingForm component
  - Display booking summary: exhibition name, date, time, price
  - Add phone number input field (Russian format validation)
  - Implement form submission: POST /api/bookings with InitData
  - Show success screen with booking confirmation
  - Handle errors (slot taken, validation errors)
  - Add "Back" and "Confirm Booking" buttons

  **Must NOT do**:
  - Don't add email field (phone is enough)
  - Don't add comments/notes field (keep simple)
  - Don't add terms & conditions (out of scope)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Form handling with validation and user feedback
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Booking confirmation UX is critical conversion point
  - **Skills Evaluated but Omitted**:
    - `playwright`: Testing, not implementation

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after Task 10)
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 12, 13 (bot messaging needs bookings to exist)
  - **Blocked By**: Task 10 (needs date/time selection)

  **References**:
  - Task 7 booking API: POST /api/bookings endpoint structure
  - Phone validation pattern: `^\\+7\\d{10}$` (Russian mobile format)
  - Telegram WebApp closing: https://core.telegram.org/bots/webapps#closing-the-mini-app - Close TMA after booking
  - React form handling: https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable

  **Acceptance Criteria**:
  
  **Automated Verification** (using chrome-devtools):
  ```
  # Agent executes via browser automation:
  1. Navigate to: booking form (after date/time selection)
  2. Wait for: phone input field
  3. Fill: input[name="phone"] with "+79811245511"
  4. Click: "Confirm Booking" button
  5. Wait for: success message to appear
  6. Assert: Text contains "Бронирование подтверждено" or similar
  7. Screenshot: .sisyphus/evidence/task-11-booking-success.png
  8. Check: POST /api/bookings was called (network log)
  9. Assert: Response status 201
  ```

  **Evidence to Capture**:
  - [ ] Screenshot of booking form
  - [ ] Screenshot of success screen
  - [ ] Network request/response for booking creation
  - [ ] Database entry showing new booking

  **Commit**: YES
  - Message: `feat(frontend): implement booking form with submission`
  - Files: `frontend/src/components/BookingForm.tsx`, `frontend/src/pages/BookingSuccess.tsx`
  - Pre-commit: `cd frontend && npx tsc --noEmit`

---

- [ ] 12. Bot Messaging - Confirmation Handler

  **What to do**:
  - Create bot message handler in `/backend/src/bot/`
  - Setup bot polling or webhook
  - Implement sendBookingConfirmation function: triggered after POST /api/bookings
  - Message template in Russian with booking details:
    ```
    ✅ Бронирование подтверждено!
    
    Выставка: {exhibition_name}
    Дата: {date}
    Время: {time}
    
    Адрес: СПб, ул. Гороховая 49 лит Б, пространство "SENO", 2 этаж
    Контакт: +7 981 124 5511
    
    Ждём вас! Напоминание придёт за день до визита.
    ```
  - Send message via Bot API to user's telegram_id

  **Must NOT do**:
  - Don't send messages to admin/manager (admin panel shows bookings)
  - Don't add inline buttons for cancellation yet (manual contact is fine for MVP)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Bot integration with API callback, requires careful error handling
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Standard bot messaging patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 13, 14, 15)
  - **Blocks**: None
  - **Blocked By**: Tasks 11, 1 (needs bookings to exist and bot token)

  **References**:
  - Telegram Bot API: https://core.telegram.org/bots/api#sendmessage - Send message method
  - node-telegram-bot-api: https://github.com/yagop/node-telegram-bot-api - Bot framework
  - Bot token from Task 1: TELEGRAM_BOT_TOKEN environment variable
  - Message formatting: https://core.telegram.org/bots/api#formatting-options - Markdown/HTML support

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Create test booking via API
  BOOKING_ID=$(curl -s -X POST http://localhost:3000/api/bookings \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A123456%7D" \
    -H "Content-Type: application/json" \
    -d '{
      "exhibition_id": 1,
      "booking_date": "2026-02-20",
      "booking_time": "15:00",
      "phone": "+79811245511"
    }' | jq -r '.id')
  
  # Check backend logs for confirmation send
  sleep 2
  tail -n 20 backend/logs/app.log | grep "Confirmation sent to user 123456"
  # Assert: Log entry exists
  
  # Manual verification note: Check Telegram for actual message delivery
  echo "Check Telegram user 123456 for confirmation message"
  ```

  **Evidence to Capture**:
  - [ ] Backend log showing message sent
  - [ ] Note about manual Telegram check

  **Commit**: YES
  - Message: `feat(bot): implement booking confirmation message handler`
  - Files: `backend/src/bot/confirmationHandler.ts`, `backend/src/bot/index.ts`
  - Pre-commit: `cd backend && npx tsc --noEmit`

---

- [ ] 13. Bot Messaging - Reminder Scheduler

  **What to do**:
  - Create cron job or scheduled task to send reminders
  - Query bookings where booking_date = tomorrow AND status = 'confirmed'
  - Send reminder message 24h before appointment:
    ```
    ⏰ Напоминание о визите!
    
    Завтра в {time} у вас запись на выставку "{exhibition_name}".
    
    Адрес: СПб, ул. Гороховая 49 лит Б, пространство "SENO", 2 этаж
    
    Если планы изменились, позвоните: +7 981 124 5511
    ```
  - Run scheduler every hour or use node-cron
  - Mark reminders as sent (add reminded_at column to bookings or use status)

  **Must NOT do**:
  - Don't send multiple reminders (once is enough)
  - Don't send reminders for cancelled bookings

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Scheduler logic with date arithmetic and bot integration
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Standard scheduling patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 12, 14, 15)
  - **Blocks**: None
  - **Blocked By**: Tasks 11, 1 (needs bookings and bot token)

  **References**:
  - node-cron: https://github.com/node-cron/node-cron - Cron job scheduler
  - Date comparison:
    ```javascript
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Query bookings where booking_date = tomorrow
    ```
  - Task 12 message sending pattern

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Create booking for tomorrow
  TOMORROW=$(date -d "+1 day" +%Y-%m-%d)
  curl -s -X POST http://localhost:3000/api/bookings \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A789012%7D" \
    -H "Content-Type: application/json" \
    -d "{
      \"exhibition_id\": 2,
      \"booking_date\": \"$TOMORROW\",
      \"booking_time\": \"16:00\",
      \"phone\": \"+79999999999\"
    }"
  
  # Trigger scheduler manually (or wait for cron)
  node backend/src/bot/reminderScheduler.js
  # Assert: Exit code 0
  
  # Check logs for reminder sent
  tail -n 10 backend/logs/app.log | grep "Reminder sent to user 789012"
  # Assert: Log entry exists
  ```

  **Evidence to Capture**:
  - [ ] Scheduler execution log
  - [ ] Reminder message sent log
  - [ ] Database query showing bookings for tomorrow

  **Commit**: YES
  - Message: `feat(bot): implement 24h reminder scheduler`
  - Files: `backend/src/bot/reminderScheduler.ts`, update to main bot script
  - Pre-commit: `cd backend && npx tsc --noEmit`

---

### Wave 5: Admin & Integration (After Wave 4)

- [ ] 14. Admin Endpoints - View Bookings

  **What to do**:
  - Create `src/routes/admin.ts`
  - GET /api/admin/bookings: List all bookings with filters (date range, exhibition, status)
  - GET /api/admin/bookings/:id: Get single booking details with user info
  - **Add admin authentication middleware (Telegram ID-based): Check InitData telegram_id against admins table**
  - Return bookings sorted by booking_date, booking_time
  - Include user and exhibition details in response (JOIN query)

  **Must NOT do**:
  - Don't build complex admin UI (just API endpoints)
  - Don't add role-based access control (single admin token is fine)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Admin API with authentication and complex queries
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Standard admin API patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Tasks 15)
  - **Blocks**: None
  - **Blocked By**: Task 7 (needs booking API foundation)

  **References**:
  - Database schema from Task 4: bookings, users, exhibitions tables
  - SQL JOIN pattern:
    ```sql
    SELECT b.*, u.first_name, u.phone, e.name as exhibition_name
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN exhibitions e ON b.exhibition_id = e.id
    ORDER BY b.booking_date, b.booking_time
    ```
  - Telegram ID-based admin auth middleware:
    ```javascript
    // Extract telegram_id from InitData
    const initData = parseInitData(req.headers['x-telegram-init-data']);
    const telegramId = initData.user.id;
    
    // Check if user is admin
    const admin = await db.query('SELECT * FROM admins WHERE telegram_id = $1', [telegramId]);
    if (!admin.rows.length) {
      return res.status(403).json({error: 'Forbidden: Admin access required'});
    }
    
    // Attach admin level to request for role-based checks
    req.admin = admin.rows[0];
    ```

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Test admin bookings list (with admin InitData)
  curl -s http://localhost:3000/api/admin/bookings \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A${HEAD_ADMIN_TELEGRAM_ID}%7D" \
    | jq 'length'
  # Assert: Returns count >= 0
  
  # Test without admin auth (regular user, should fail)
  curl -s http://localhost:3000/api/admin/bookings \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A999999%7D" \
    | jq '.error'
  # Assert: Returns "Forbidden" or "Admin access required"
  
  # Test single booking details
  curl -s http://localhost:3000/api/admin/bookings/1 \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A${HEAD_ADMIN_TELEGRAM_ID}%7D" \
    | jq '.user.phone'
  # Assert: Returns phone number
  ```

  **Evidence to Capture**:
  - [ ] Admin bookings list response
  - [ ] Single booking details response
  - [ ] Unauthorized error response

  **Commit**: YES
  - Message: `feat(admin): implement admin booking view endpoints`
  - Files: `backend/src/routes/admin.ts`, admin middleware
  - Pre-commit: `cd backend && npx tsc --noEmit`

---

- [ ] 15. Admin Endpoints - Manage Bookings

  **What to do**:
  - PATCH /api/admin/bookings/:id/status: Update booking status (confirmed, completed, cancelled, no-show)
  - PATCH /api/admin/bookings/:id/reschedule: Change booking date/time (with capacity check)
  - DELETE /api/admin/bookings/:id: **Hard delete** (remove from DB - bookings are low-stakes, no audit trail needed for MVP)
  - Add admin authentication middleware to all endpoints (Telegram ID check)
  - Validate status transitions (e.g., can't complete a cancelled booking)

  **Must NOT do**:
  - Don't send automatic notifications on admin actions (manual contact is fine)
  - Don't add booking creation via admin API (users create bookings via TMA)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: State management with validation rules
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - All skills: Standard CRUD operations

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with Task 14)
  - **Blocks**: None
  - **Blocked By**: Task 7 (needs booking API foundation)

  **References**:
  - Task 14 admin auth middleware pattern
  - Status transitions:
    ```
    pending → confirmed → completed
    pending → cancelled
    confirmed → cancelled
    confirmed → no-show
    ```
  - Task 7 availability check logic for reschedule

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash):
  ```bash
  # Update booking status (with admin InitData)
  curl -s -X PATCH http://localhost:3000/api/admin/bookings/1/status \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A${HEAD_ADMIN_TELEGRAM_ID}%7D" \
    -H "Content-Type: application/json" \
    -d '{"status": "completed"}' \
    | jq '.status'
  # Assert: Returns "completed"
  
  # Reschedule booking
  curl -s -X PATCH http://localhost:3000/api/admin/bookings/1/reschedule \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A${HEAD_ADMIN_TELEGRAM_ID}%7D" \
    -H "Content-Type: application/json" \
    -d '{
      "booking_date": "2026-02-25",
      "booking_time": "17:00"
    }' | jq '.booking_date'
  # Assert: Returns "2026-02-25"
  
  # Hard delete booking
  curl -s -X DELETE http://localhost:3000/api/admin/bookings/1 \
    -H "X-Telegram-Init-Data: user=%7B%22id%22%3A${HEAD_ADMIN_TELEGRAM_ID}%7D"
  # Assert: HTTP 204 or 200
  
  # Verify deletion (should not exist)
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM bookings WHERE id=1;"
  # Assert: Returns "0"
  ```

  **Evidence to Capture**:
  - [ ] Status update response
  - [ ] Reschedule response
  - [ ] Delete confirmation
  - [ ] Database verification of changes

  **Commit**: YES
  - Message: `feat(admin): implement booking management endpoints`
  - Files: `backend/src/routes/admin.ts` (update)
  - Pre-commit: `cd backend && npx tsc --noEmit`

---

- [ ] 16. Integration Testing & Deployment Prep

  **What to do**:
  - Create end-to-end test script that covers full booking flow
  - Test TMA → Backend → Database → Bot messaging pipeline
  - Verify all acceptance criteria from previous tasks
  - Create deployment checklist: environment variables, database migrations, build steps
  - Document API endpoints in README or OpenAPI spec
  - Add production environment setup guide (.env.production example)
  - Test with real Telegram bot (not just localhost)

  **Must NOT do**:
  - Don't deploy to production yet (just prepare)
  - Don't add CI/CD pipeline (out of scope for this plan)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Integration testing requires understanding the entire system and orchestrating complex verification
  - **Skills**: [`playwright`] (optional, if using browser automation for E2E)
    - `playwright`: Full booking flow includes TMA UI interaction
  - **Skills Evaluated but Omitted**:
    - Other skills: Integration testing is comprehensive

  **Parallelization**:
  - **Can Run In Parallel**: NO (final integration task)
  - **Parallel Group**: Sequential (after all Wave 4 & 5 tasks)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 12, 13, 14, 15 (needs everything complete)

  **References**:
  - All previous task acceptance criteria
  - Telegram Bot testing: https://core.telegram.org/bots/webapps#testing-mini-apps - Test environment setup
  - Example E2E flow:
    ```
    1. User opens bot → /start
    2. User clicks Mini App button
    3. TMA loads, shows exhibitions
    4. User selects exhibition, date, time
    5. User enters phone, confirms
    6. Backend creates booking in DB
    7. Bot sends confirmation message
    8. Admin views booking in admin panel
    ```

  **Acceptance Criteria**:
  
  **Automated Verification** (using Bash + chrome-devtools):
  ```bash
  # Run full E2E test script
  ./scripts/test-e2e.sh
  # Assert: Exit code 0
  # Assert: All checks pass
  
  # Verify database has test booking
  psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM bookings WHERE phone='+79999999999';"
  # Assert: Returns count > 0
  
  # Check deployment checklist
  [ -f "docs/deployment.md" ]
  # Assert: Exit code 0
  
  # Verify environment variables documented
  grep -q "TELEGRAM_BOT_TOKEN" .env.example && grep -q "DATABASE_URL" .env.example && grep -q "HEAD_ADMIN_TELEGRAM_ID" .env.example
  # Assert: Exit code 0
  ```

  **Evidence to Capture**:
  - [ ] E2E test execution log
  - [ ] Screenshots of full booking flow
  - [ ] Database state after E2E test
  - [ ] Deployment checklist document

  **Commit**: YES
  - Message: `test: add E2E integration tests and deployment prep`
  - Files: `scripts/test-e2e.sh`, `docs/deployment.md`, `docs/api-spec.md`
  - Pre-commit: `./scripts/test-e2e.sh` (if tests exist)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(bot): create Telegram bot via BotFather` | .env.example, docs/bot-setup.md | curl bot API |
| 2 | `chore: initialize project structure` | package.json, folders, configs | ls -R |
| 3 | `feat(db): setup PostgreSQL database` | database/setup.sql | psql connection test |
| 4 | `feat(db): implement database schema with Gallery Way exhibitions` | database/migrations/001_initial_schema.sql | psql \dt, SELECT exhibitions |
| 5 | `feat(backend): setup Express server with TypeScript and InitData validation` | backend/src/, tsconfig.json | curl /health |
| 6 | `feat(api): implement user and exhibition endpoints` | backend/src/routes/users.ts, exhibitions.ts | curl /api/exhibitions |
| 7 | `feat(api): implement booking endpoints with double-booking prevention` | backend/src/routes/bookings.ts | curl POST /api/bookings |
| 8 | `feat(frontend): setup TMA React project with Telegram SDK` | frontend/src/, vite.config.ts | npm run build |
| 9 | `feat(frontend): implement exhibition list UI` | frontend/src/components/ExhibitionList.tsx | screenshot |
| 10 | `feat(frontend): implement date/time picker with availability check` | frontend/src/components/DateTimePicker.tsx | screenshot |
| 11 | `feat(frontend): implement booking form with submission` | frontend/src/components/BookingForm.tsx | screenshot + API call |
| 12 | `feat(bot): implement booking confirmation message handler` | backend/src/bot/confirmationHandler.ts | check logs |
| 13 | `feat(bot): implement 24h reminder scheduler` | backend/src/bot/reminderScheduler.ts | scheduler execution |
| 14 | `feat(admin): implement admin booking view endpoints` | backend/src/routes/admin.ts | curl /api/admin/bookings |
| 15 | `feat(admin): implement booking management endpoints` | backend/src/routes/admin.ts | curl PATCH/DELETE |
| 16 | `test: add E2E integration tests and deployment prep` | scripts/, docs/ | run E2E script |

---

## Success Criteria

### Verification Commands

**Full system health check:**
```bash
# Database
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM exhibitions;" # → 5

# Backend
curl http://localhost:3000/api/exhibitions | jq 'length' # → 5

# Frontend (dev)
curl -s http://localhost:5173 | grep "Gallery Way" # → found

# Bot
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" | jq '.ok' # → true
```

**Create test booking end-to-end:**
```bash
# Via TMA or direct API
curl -X POST http://localhost:3000/api/bookings \
  -H "X-Telegram-Init-Data: [real-init-data]" \
  -H "Content-Type: application/json" \
  -d '{
    "exhibition_id": 1,
    "booking_date": "2026-03-01",
    "booking_time": "14:00",
    "phone": "+79811245511"
  }'
# → Returns booking ID
# → Bot sends confirmation message
# → Admin can see booking via GET /api/admin/bookings
```

### Final Checklist
- [ ] All 5 exhibitions seeded in database
- [ ] User can book via TMA from exhibition selection to confirmation
- [ ] Double-booking prevention works (same slot rejects second booking)
- [ ] Confirmation message sent immediately after booking
- [ ] Reminder sent 24h before booking (scheduler running)
- [ ] Admin can view all bookings with user details
- [ ] Admin can update status, reschedule, or cancel bookings
- [ ] All environment variables documented in .env.example
- [ ] Deployment guide exists with step-by-step instructions
- [ ] No hardcoded secrets or Gallery Way data (use environment variables)