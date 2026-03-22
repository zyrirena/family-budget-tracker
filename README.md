# Family Budget Tracker

A full-stack family budgeting app with AI insights powered by Claude.

## Tech Stack
- **Frontend**: Next.js 14 (Web)
- **Mobile**: Expo / React Native
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT
- **AI**: Anthropic Claude API

## Project Structure
```
family-budget-tracker/
├── backend/      # Express API server
├── web/          # Next.js web app
└── mobile/       # Expo React Native app
```

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values
npx prisma db push
node src/prisma/seed.js
npm run dev
```

### 2. Web
```bash
cd web
npm install
cp .env.local.example .env.local
# Fill in your .env.local values
npm run dev
```

### 3. Mobile
```bash
cd mobile
npm install
npx expo start
```

## Demo Login
- Email: `demo@familybudget.app`
- Password: `password123`
