# Node.js Service Folder Structure & Logger Guidelines

## Recommended Folder Structure

```
src/
├── config/         # Configuration files (env loader, constants, etc.)
├── controllers/    # Route handlers for incoming API requests
├── middlewares/    # Express middlewares (auth, error handling, etc.)
├── models/         # TypeScript interfaces/classes for DB schemas and DTOs
├── routes/         # Route definitions (Express routers)
├── services/       # Business logic, database, and external API communication
├── types/          # Shared TypeScript types and enums
├── utils/          # Utility/helper functions (logging, validation, etc.)
└── index.ts        # Entry point (app/server bootstrap)
```

## Logger Utility (Winston + winston-daily-rotate-file)

- JSON structured logs, log levels, daily file rotation.
- Log level is set via `.env` (`LOG_LEVEL`, default: `debug`).
- Supports tags and child loggers for context.

**Usage:**

```ts
import { logObj, createLoggerWithTags } from './utils/logger';

// Simple log
logObj.info('Server started', ['server']);
logObj.error('Something failed', ['DB']);

// Tagged logger
const appleLogger = createLoggerWithTags(['api-apple']);
appleLogger.info('Apple API called');
const fetchLogger = createLoggerWithTags(['api-apple', 'fetch review']);
fetchLogger.debug('Fetched reviews', [], { count: 10 });
```

**All logs are written to `logs/app-YYYY-MM-DD.log` and printed to the console.**

**.gitignore** is set up to ignore `dist/`, `logs/`, `secret/`, `.env`, and `node_modules` folders/files for all services in the monorepo.

> Copy this structure and logger setup for all Node.js microservices in this project for consistency and maintainability.
# Database Setup & Initialization

This project provides a TypeScript script to automate MongoDB collection and index setup for local development and onboarding.

## Prerequisites

- Docker and Docker Compose installed
- MongoDB service running via Docker Compose (`docker compose up mongo`)
- `.env` file in this directory with a valid `MONGODB_URI` (see example below)

Example `.env`:
```
PORT=3001
MONGODB_URI=mongodb://root:example@localhost:27017/repliq?authSource=admin
```

## Usage

### SAFE Mode (default)
Creates collections and indexes if missing, and inserts sample data if the database is empty. Does not drop any data.

```
npm run setupdb
```

### FORCE Mode
Drops all collections and recreates them from scratch. **All data will be lost!**

```
npm run setupdb -- --force
```

## What the Script Does
- Connects to MongoDB using the URI from `.env`
- Drops collections if in FORCE mode
- Creates all required indexes
- Inserts sample data for development if in SAFE mode and collections are empty
- Prints clear logs about the mode and actions taken

## Troubleshooting

If you see connection errors:
- Make sure Docker is running and you have started MongoDB with: `docker compose up mongo`
- Check your `docker-compose.yml` for the correct username, password, and port
- Ensure your `.env` file has the correct `MONGODB_URI`
- If running on Apple Silicon, ensure your MongoDB image supports your architecture

---
# Review Ingestion

Node.js microservice for ingesting and deduplicating user reviews in RepliQ.

## Purpose
The Review Ingestion service fetches user reviews from app stores, deduplicates them, and triggers downstream processing.

## Responsibilities
- Fetch reviews from Apple Store (and Google Play in the future).
- Deduplicate reviews to avoid reprocessing.
- Support scheduled and manual triggers.
- Provide a health check endpoint (`/health`).

## Key Endpoints
- `GET /health` – Health check endpoint. Returns the status of the review-ingestion service.

- `POST /api/reviews/ingest/:productId` – Ingest reviews for a specific product.
  - **Path parameter:**
    - `productId` (string, required)
  - **Request body:**
    - (JSON body, structure depends on ingestion logic)
  - **Response:**
    - Success or error message depending on ingestion result.

- `GET /appleapitest/reviews` – Fetch Apple customer reviews.
- `GET /appleapitest/processed-reviews` – Fetch processed Apple reviews.
- `GET /appleapitest/processed-reviews-csv` – Export processed Apple reviews as CSV.

## Dependencies
- Depends on review-processing and semantic-search services for downstream processing.
- External dependencies: app store APIs.

## Service Communication & Endpoint Configuration
- All service endpoints (including this one) are configured via environment variables.
- For local development, copy `.env.example` to `.env` and adjust as needed.
- For Docker Compose, service names (e.g., `review-ingestion:3001`) are used as hostnames in environment variables.
- Every service should load all other service endpoints from environment variables, not hardcoded values.
- To add a new service or change an endpoint, update the `.env` file (for local) and `docker-compose.yml` (for Docker), and document the change in the README.

## Impact of Changes
- Changes may affect review processing, ticket creation, and notification workflows.
- API changes may require updates in dependent services and clients.

## Setup & Usage
- Run with `npm run start:dev` (see Makefile for orchestration).
- Ensure all dependent microservices and app store API access are available.
- Copy `.env.example` to `.env` and configure endpoints as needed.
