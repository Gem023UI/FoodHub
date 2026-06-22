# FoodHub Backend

FoodHub is a TypeScript Node.js API for canteen stalls, menus, reviews, favorites, and future budget/ranking features.

## Current scaffold

- TypeScript + Node.js + Express
- MongoDB connection helper with Mongoose
- Health check endpoint at `GET /health`

## Frontend

The React + TypeScript frontend lives in [frontend](frontend).

```bash
cd frontend
npm install
npm run dev
```

## Run locally

1. Set environment variables:

```bash
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/foodhub
JWT_SECRET=change-me-in-production
```

2. Start in development:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```