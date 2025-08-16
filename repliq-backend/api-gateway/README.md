# API Gateway

The API Gateway is an Express-based microservice that acts as the single entry point for all API requests in the RepliQ platform. It is responsible for routing requests to the appropriate backend microservices, providing a unified API surface, and handling basic request validation. Future enhancements may include authentication and authorization.

---

## Table of Contents

- [Purpose](#purpose)
- [Responsibilities](#responsibilities)
- [API Endpoints](#api-endpoints)
- [Folder Structure](#folder-structure)
- [Environment Variables](#environment-variables)
- [Setup & Usage](#setup--usage)
- [Development Commands](#development-commands)
- [Service Communication](#service-communication)
- [Impact of Changes](#impact-of-changes)

---

## Purpose

The API Gateway serves as the main entry point for all external and internal API requests in the RepliQ platform. It routes requests to the correct microservice, exposes a unified API, and provides a health check endpoint.

---

## Responsibilities

- Route incoming API requests to the correct microservice (e.g., review-ingestion, notification, JIRA integration, etc.).
- Expose a unified API surface for clients.
- Provide a health check endpoint (`/health`).
- (Planned) Handle authentication and authorization for all services.

---

## API Endpoints

- `GET /health`  
  Health check endpoint. Returns the status of the API Gateway and its dependencies.

- All other endpoints  
  Routed to respective microservices based on the request path. For example:
  - `/review-ingestion/*` → review-ingestion service
  - `/review-processing/*` → review-processing service
  - `/notification/*` → notification service

---

## Folder Structure

```
api-gateway/
├── Dockerfile
├── jest.config.js
├── package.json
├── README.md
├── tsconfig.json
├── coverage/
├── src/
│   ├── index.ts
│   ├── types.d.ts
│   ├── config/
│   ├── middlewares/
│   ├── routes/
│   ├── test/
│   └── utils/
└── test/
```

- `src/` – Main source code for the API Gateway.
- `config/` – Configuration files and environment variable management.
- `middlewares/` – Express middlewares (e.g., logging, error handling).
- `routes/` – Route definitions and proxy logic.
- `utils/` – Utility functions.
- `test/` – Test files.

---

## Environment Variables

All service endpoints and configuration are managed via environment variables. For Docker Compose, service names (e.g., `review-ingestion:3001`) are used as hostnames.

Key variables (see `docker-compose.yml` for full list):

- `PORT` (default: 3000): Port to run the gateway on.
- `REVIEW_INGESTION_URL`: URL for review-ingestion service.
- `REVIEW_PROCESSING_URL`: URL for review-processing service.
- `NOTIFICATION_URL`: URL for notification service.
- `MONGODB_URI`: MongoDB connection string (used for health checks).

To override or add variables, update your `.env` file (for local) or `docker-compose.yml` (for Docker).

---

## Setup & Usage

### Prerequisites

- Node.js (see `package.json` for version)
- Docker & Docker Compose (for running with containers)

### Local Development

1. Install dependencies:
   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and adjust as needed.

3. Start the service in development mode:
   ```sh
   npm run start:dev
   ```

4. The API Gateway will be available at [http://localhost:3000](http://localhost:3000).

### Docker Compose

To run all services (including the API Gateway) via Docker Compose:

```sh
docker compose up --build --force-recreate
```

- To run in detached mode:
  ```sh
  docker compose up --build --force-recreate -d
  ```
- To stop all services:
  ```sh
  docker compose down
  ```

---

## Development Commands

- `npm run start:dev` – Start the API Gateway in development mode (with hot reload).
- `npm run build` – Build the TypeScript code.
- `npm test` – Run tests.
- `npm run lint` – Lint the codebase.

---

## Service Communication

- All service endpoints are configured via environment variables.
- The gateway proxies requests to other microservices using these URLs.
- To add a new service or change an endpoint, update the `.env` file (for local) and `docker-compose.yml` (for Docker), and document the change in the README.

---

## Impact of Changes

- Changes to routing logic or API contracts may impact all clients and downstream microservices.
- Adding/removing endpoints may require updates in dependent services and clients.

---

## Troubleshooting

- **Port already in use?**  
  Stop any process using the port (e.g., `lsof -ti :3000 | xargs kill -9`).
- **Logs:**  
  Use `docker compose logs -f` to view logs for all services.
- **.env files:**  
  If you need to override environment variables, create a `.env` file in the relevant service directory.

---

## Summary

The API Gateway is the central routing service for the RepliQ backend. It is designed for extensibility and ease of configuration, with all service endpoints managed via environment variables. For full functionality, ensure all dependent microservices are running.

---
