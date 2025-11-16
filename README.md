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

## 🗂 API Overview
1. POST /api/analytics/collect - Collects and stores analytics data such as user interactions, device type, and timestamps.
2. GET /api/analytics/event-summary - Returns aggregated statistics for a particular event including count, unique users, and device breakdown.
3. GET /api/analytics/user-stats - Fetch detailed information about users associated with events.
4. GET /api/auth/api-key/{appId} - Fetches app information by its ID. Returns the API key details only if valid.
5. POST /api/auth/register - Registers a user and creates an app with an API key.
6. POST /api/auth/revoke - Revokes an API key for an app, preventing further analytics submissions.

## Challenges Faced & Solutions Implemented

1. Express Router error: “Router.use() requires a middleware function but got an Object”
Cause: Exporting an object instead of a router in analytics.routes.js.
Fix: Ensure the file exports:

2. User-agent parsing crash (“parseUserAgent is not defined”)
Cause: Missing import for UA parser.
Fix: Added proper helper + import:

3. API key failing for valid keys
Cause: Comparing hashed API key incorrectly.
Fix: Proper bcrypt comparison:

## Setup

1. **Clone the repository**

git clone https://github.com/lakhoreJanvi/website-analytics-app

2. **Create a .env file

cp .env.example .env
Edit .env to set:

PORT=3000
DATABASE_URL=postgres://postgres:postgres@db:5432/analytics
REDIS_URL=redis://redis:6379
SESSION_SECRET=your-secret-key

3. Build and start Docker containers

docker-compose up --build

## deployed app links

- For accessing API endpoints: https://website-analytics-app.onrender.com/api/docs/
- For accessing google Auth for onboarding apps/websites: https://website-analytics-app.onrender.com/api/auth/google