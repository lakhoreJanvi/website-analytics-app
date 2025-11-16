# Website Analytics Backend

## Summary
A complete backend analytics platform built with Node.js, Express, PostgreSQL, Redis, Sequelize, Docker, and Google OAuth.
It allows websites or apps to send events, view analytics, manage API keys, and onboard using Google authentication.

## 🚀 Features
## Event Tracking

- Collect any event (login_click, cta_view, purchase, etc.)
- Store URL, referrer, device, timestamp, custom metadata
- Auto-detect browser + OS via ua-parser-js

## User-Based Analytics

- Track events grouped by userId
- Compute latest device info
- Most recent events per user

## Aggregated Event Summary

- Total events
- Unique users (via metadata.userId)
- Device breakdown (mobile/web/unknown)
- Optional filtering by:
- Date range
- App ID

## API Key Authentication

- Validates requesting applications
- Supports revocation (app.revoked)
- Middleware protected endpoints

## Redis Caching

- Caches event summary results
- Auto-invalidates cache on new events

## Secure by Default

- Helmet security middleware
- Rate limiting
- Session handling
- Passport authentication (ready for login/signup)

## Developer Friendly

- Full OpenAPI/Swagger documentation
- Docker-ready environment
- Auto-syncing Sequelize models


1. Installation
Clone the repository
git clone https://github.com/lakhoreJanvi/analytics-service
cd analytics-service

2. Create an .env file
PORT=3000
DATABASE_URL=postgres://postgres:postgres@db:5432/analytics
REDIS_URL=redis://redis:6379
SESSION_SECRET=supersecret

3. Start using Docker (recommended)
docker-compose up --build

## 🗂 API Overview
1. POST /api/analytics/collect - Collect an analytics event
2. GET /api/analytics/event-summary - Shows summary of event
3. GET /api/analytics/user-stats - Shows user details
4. GET /api/auth/api-key/{appId} - User gets information through appId
5. POST /api/auth/register - To register the user
6. POST /api/auth/revoke - To revoke an apikey
