# Gallery Way - Telegram Mini App

Telegram Mini App for booking exhibitions at Gallery Way (gallery-way.ru).

## Features

- Exhibition booking through Telegram
- Automatic confirmation messages
- 24h reminder notifications
- Admin booking management

## Tech Stack

- **Frontend**: React + TypeScript + @telegram-apps/sdk
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Bot**: node-telegram-bot-api

## Quick Start

### 1. Setup Database

```bash
# Start PostgreSQL in Docker
npm run db:start

# Run migrations
npm run db:migrate
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your TELEGRAM_BOT_TOKEN
```

### 3. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run Development Servers

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

## Project Structure

```
gallery-bot/
  backend/         # Express API server
  frontend/        # React TMA application
  database/        # SQL migrations
  docs/            # Documentation
  scripts/         # Utility scripts
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| TELEGRAM_BOT_TOKEN | Bot token from @BotFather |
| DATABASE_URL | PostgreSQL connection string |
| HEAD_ADMIN_TELEGRAM_ID | Admin Telegram ID |
| PORT | Backend server port (default: 3000) |
| FRONTEND_URL | Frontend URL for CORS |

## Exhibitions

- "Время жить" - Daily, 1000 RUB
- "Сквозь страх" - Daily, 1000 RUB
- "Мама, я тебя прощаю" - Tue/Thu/Sat, 1000 RUB
- "Тело" - Mon/Fri, 1000 RUB
- "Папа, давай поговорим" - Wed/Sun, 1000 RUB

## Location

St. Petersburg, Gorokhovaya 49 B, SENO, 2nd floor
Hours: 12:00-21:00 daily
