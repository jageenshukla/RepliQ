# RepliQ Backend - Docker Compose Developer Guide

> **Note:** This README is for the backend services. For project overview and roadmap, see the root-level `../README.md`. For details about each microservice (architecture, API, etc.), see the README inside the respective service folder.

## Getting Started

1. **Clone the repository and enter the backend directory:**
   ```sh
   git clone <your-repo-url>
   cd repliq-backend
   ```

2. **Install Docker Desktop:**
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/) for your OS and install it.
   - Ensure Docker is running: `docker --version` and `docker compose version` should both work.

3. **Build and start all services:**
   ```sh
   docker compose up --build --force-recreate
   ```
   - This will build all images and start all containers fresh.
   - To run in the background (detached mode):
     ```sh
     docker compose up --build --force-recreate -d
     ```

4. **Stop all services:**
   ```sh
   docker compose down
   ```
   - Add `-v` to also remove volumes (database data, etc):
     ```sh
     docker compose down -v
     ```

5. **View logs for all services:**
   ```sh
   docker compose logs -f
   ```

6. **Access running services:**
   - API Gateway: http://localhost:3000
   - Review Ingestion: http://localhost:3001
   - Review Processing: http://localhost:3002
   - Notification: http://localhost:3004
   - MongoDB: mongodb://admin:securepassword123@localhost:27017/repliq?authSource=admin (for internal use)
   - Ollama (LLM): http://localhost:11434

## Backend Architecture

The following diagram illustrates the architecture of the backend services:

![Backend Architecture](./assets//diagrams/backend-architecture.png)

---

## Service Overview & Environment Variables

### 1. api-gateway
**Role:** Main entrypoint for all API requests. Proxies requests to other backend services.

**Docker Compose Service:** `api-gateway`

**Ports:** 3000 (host:container)

**Environment Variables:**
  - `PORT` (default: 3000): Port to run the gateway on.
  - `REVIEW_INGESTION_URL` (default: http://review-ingestion:3001): URL for review-ingestion service.
  - `REVIEW_PROCESSING_URL` (default: http://review-processing:3002): URL for review-processing service.
  - `NOTIFICATION_URL` (default: http://notification:3004): URL for notification service.
  - `MONGODB_URI` (default: mongodb://admin:securepassword123@mongo:27017/repliq?authSource=admin): MongoDB connection string (used directly for health checks in the gateway).

**Usage:**
  - Proxies requests to `/review-ingestion`, `/review-processing`, `/notification` based on path.
  - Only these three services are enabled in code; others are ignored.

### 2. review-ingestion
**Role:** Handles ingestion of reviews and related data. After ingesting reviews, it triggers review processing and sends notifications.

**Docker Compose Service:** `review-ingestion`

**Ports:** 3001 (host:container)

**Environment Variables:**
  - `PORT` (default: 3001): Port to run the service on.
  - `MONGODB_URI` (required): MongoDB connection string.
  - `NOTIFICATION_BASE_URL` (default: http://notification:3004): Base URL for the notification service.
  - `PROCESS_REVIEW_BASE_URL` (default: http://review-processing:3002): Base URL for the review-processing service.
  - `FEATURE_SPEC_URL` (optional): Used for feature spec integration.
  - `LOG_LEVEL` (default: debug): Log verbosity.

**Usage:**
  - Exposes endpoints for review ingestion and health checks.
  - After successful ingestion, it:
    - Calls the review-processing service to process new reviews.
    - Sends a notification via the notification service.
  - Requires a valid `.env` file for secrets if not using defaults.

### 3. review-processing
**Role:** Processes reviews, runs analysis, and interacts with LLMs.

**Docker Compose Service:** `review-processing`

**Ports:** 3002 (host:container)

**Environment Variables:**
  - `PORT` (default: 3002): Port to run the service on.
  - `MONGODB_URI` (required): MongoDB connection string. Used in code to connect to the database.
  - `CHROMA_HOST`, `CHROMA_PORT`: Not currently used in code, but reserved for future vector DB integration.
  - `OPENAI_API_BASE`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `MODEL_NAME`, `OLLAMA_API_BASE`: Used for LLM and AI integrations. If not set, some features may not work.

**Usage:**
  - Exposes endpoints for review processing and health checks.
  - Requires a valid `.env` file for secrets if not using defaults.

### 4. notification
**Role:** Handles sending notifications to users or systems.

**Docker Compose Service:** `notification`

**Ports:** 3004 (host:container)

**Environment Variables:**
  - `PORT` (default: 3004): Port to run the service on.
  - `MONGODB_URI` (required): MongoDB connection string. Used in code to connect to the database.

**Usage:**
  - Exposes endpoints for sending notifications and health checks.
  - Requires a valid `.env` file for secrets if not using defaults.

### 5. mongo
**Role:** MongoDB database for all backend services.

**Docker Compose Service:** `mongo`

**Ports:** 27017 (host:container)

**Environment Variables:**
  - `MONGO_INITDB_ROOT_USERNAME` (default: admin)
  - `MONGO_INITDB_ROOT_PASSWORD` (default: securepassword123)

**Usage:**
  - Data is persisted in a local directory as defined in the `docker-compose.yml` volume config.

### 6. ollama
**Role:** Local LLM (Large Language Model) inference service.

**Docker Compose Service:** `ollama`

**Ports:** 11434 (host:container)

**Usage:**
  - Pre-pulls the `llama3` model on startup for local AI/LLM tasks.
  - Data is persisted in a local directory as defined in the `docker-compose.yml` volume config.

---

## Environment Variables

Each service requires a `.env` file for configuration. Use the provided `.env.example` files as a reference:

1. Copy the `.env.example` file to `.env`:
   ```sh
   cp .env.example .env
   ```
2. Update the `.env` file with the required values, such as database connection strings, API keys, and webhook URLs.

## Database Setup

To set up the database, use the `setupDatabase.ts` script located in the `review-ingestion/scripts/` folder:

1. Update the required fields in the script, such as:
   - `.p8` file path
   - Apple Key ID
   - Issuer ID
   - Bundle ID
   - App ID
   - Slack webhook URL

2. Run the script using:
   ```sh
   npm run setupdb-force
   ```
   or, if inside the container:
   ```sh
   node dist/scripts/setupDatabase.js --force
   ```

## LLM Setup

To enable LLM integrations for the `review-processing` service, you have two options:

1. **Run on Cloud**:
   - Set the base URL for cloud-based models in the `.env` file:
     ```env
     OPENAI_API_BASE=https://api.ai.public.rakuten-it.com/openai/v1
     OPENAI_API_KEY=<your_openai_api_key>
     ANTHROPIC_API_KEY=<your_anthropic_api_key>
     MODEL_NAME=gpt-4.1
     ```
   - Use this option if you want to leverage cloud-based proprietary models.

2. **Run Locally**:
   - Use the Ollama Docker container for local inference.
   - Set the base URL for the local model in the `.env` file:
     ```env
     OLLAMA_API_BASE=http://ollama:11434
     MODEL_NAME=llama3
     ```
   - Ensure the Ollama service is running via Docker Compose.

For more information on configuring models, refer to the [ADK Documentation](https://google.github.io/adk-docs/agents/models/#using-cloud-proprietary-models-via-litellm).

## Testing the Setup

1. Run automated tests to verify the setup:
   ```sh
   npm test
   ```
2. Check the test coverage reports in the `coverage/` folder for detailed results.

## Troubleshooting

- **Docker Compose not found?** Install Docker Desktop and ensure `docker compose` works in your terminal.
- **Port already in use?** Stop any process using the port (e.g., `lsof -ti :3000 | xargs kill -9`).
- **Volume/data issues?** Use `docker compose down -v` to reset all data.
- **Logs:** Use `docker compose logs -f` to view logs for all services.
- **.env files:** If you need to override environment variables, create a `.env` file in the relevant service directory (see each service's Dockerfile for details).

---

## Contributing & Extending

- To add new services, create a new folder, add a Dockerfile, and update `docker-compose.yml`.
- To add new environment variables, update the relevant service code and Docker Compose config.

---

## Summary

All backend services are now managed and run via Docker Compose. No Makefile or local dependency setup is required. Just clone, run Docker Compose, and you’re ready to develop or test the backend.
