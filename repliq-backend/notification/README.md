# Notification

Node.js microservice for sending notifications in RepliQ.

## Purpose
The Notification service sends alerts and updates to chat applications (Slack, Teams, etc.) when important events occur in the platform.

## Responsibilities
- Send notifications for ticket creation, approvals, and other key events.
- Support multiple notification channels (Slack, Teams, etc.).
- Provide a health check endpoint (`/health`).

## Key Endpoints
- `GET /health` – Health check endpoint. Returns the status of the Notification service.

- `POST /notify` – Sends a notification.
  - **Request body:**
    - `productId` (string, required)
    - `type` (string, required)
    - `message` (string, required)
  - **Response:**
    - Success: `{ status: 'success', message: 'Notification sent successfully.' }`
    - Error: `{ status: 'error', message: '...' }`

## Dependencies
- Depends on approval, JIRA integration, and review-processing services for event triggers.
- External dependencies: chat APIs (Slack, Teams, etc.).

## Service Communication & Endpoint Configuration
- All service endpoints (including this one) are configured via environment variables.
- For local development, copy `.env.example` to `.env` and adjust as needed.
- For Docker Compose, service names (e.g., `review-ingestion:3001`) are used as hostnames in environment variables.
- Every service should load all other service endpoints from environment variables, not hardcoded values.
- To add a new service or change an endpoint, update the `.env` file (for local) and `docker-compose.yml` (for Docker), and document the change in the README.

## Impact of Changes
- Changes may affect how and when notifications are sent.
- API changes may require updates in dependent services and notification channels.

## Setup & Usage
- Run with `npm run start:dev` (see Makefile for orchestration).
- Ensure all dependent microservices and chat API credentials are available.
- Copy `.env.example` to `.env` and configure endpoints as needed.
