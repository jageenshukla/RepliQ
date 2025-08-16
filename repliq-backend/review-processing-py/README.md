# Review Processing

Python microservice for analyzing and replying to user reviews in RepliQ.

## Purpose
The Review Processing service analyzes user reviews using AI, generates replies, and triggers ticket creation and notifications as needed.

## Responsibilities
- Analyze reviews using LLMs and Google ADK.
- Generate personalized replies using templates and review content.
- Trigger ticket creation and notifications.
- Provide a health check endpoint (`/health`).

## Key Endpoints
- `GET /health` – Health check endpoint. Returns the status of the review-processing service.

- `POST /process-review` – Process a batch of reviews for a product.
  - **Request body:**
    - `productId` (string, required)
    - `sourceReviewIds` (list of strings, required)
  - **Response:**
    - Processing result or error message.

- `POST /analyze-review` – Analyze a single review.
  - **Request body:**
    - `review_text` (string, required)
  - **Response:**
    - Analysis result.

- `POST /generate-reply` – Generate a reply for a customer review.
  - **Request body:**
    - `customer_review` (string, required)
    - `customer_name` (string, required)
  - **Response:**
    - Generated reply.

- `POST /translate` – Translate Japanese text to English.
  - **Request body:**
    - `japanese_text` (string, required)
  - **Response:**
    - Translated text.
# Review Processing

Python microservice for analyzing and replying to user reviews in RepliQ.

## Purpose
The Review Processing service analyzes user reviews using AI, generates replies, and triggers ticket creation and notifications as needed.

## Responsibilities
- Analyze reviews using LLMs and Google ADK.
- Generate personalized replies using templates and review content.
- Trigger ticket creation and notifications.
- Provide a health check endpoint (`/health`).

## Key Endpoints
- `GET /health` – Health check endpoint.
- Other endpoints for review analysis and reply generation (see source code for details).

## Dependencies
- Depends on review-ingestion, feature-spec, and notification services for full workflow.
- May use external LLM/AI APIs.

## Service Communication & Endpoint Configuration
- All service endpoints (including this one) are configured via environment variables.
- For local development, copy `.env.example` to `.env` and adjust as needed.
- For Docker Compose, service names (e.g., `review-ingestion:3001`) are used as hostnames in environment variables.
- Every service should load all other service endpoints from environment variables, not hardcoded values.
- To add a new service or change an endpoint, update the `.env` file (for local) and `docker-compose.yml` (for Docker), and document the change in the README.

## Database Setup
- If this service requires a database, add connection variables to `.env.example` (e.g., `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`).
- Document the database type (e.g., PostgreSQL, MongoDB) and setup steps here.
- For local development, you can use Docker Compose to run a database container.
- Use migration tools (e.g., Alembic for Python, Prisma/TypeORM for Node.js) as needed.

## Service Template
- To create a new microservice:
  1. Copy an existing service folder as a starting point.
  2. Update the README, endpoints, and dependencies.
  3. Add the new service to the Makefile and Docker Compose as needed.
  4. Ensure `.env.example` and health check endpoints are present.

## API Documentation
- Document all endpoints in this README or generate OpenAPI/Swagger docs.
- For Python, consider using FastAPI (auto-generates OpenAPI docs) or Flask-RESTX.
- For Node.js, use Swagger UI Express or similar tools.

## CI/CD
- Recommended: Set up GitHub Actions, GitLab CI, or similar for automated testing and deployment.
- Example: Use GitHub Actions to run `make test` and `make test-coverage` on every pull request.
- Add badges to the README for build and test status.

## Docker
- This service includes a `Dockerfile` and is referenced in the root `docker-compose.yml`.
- Ensure all environment variables are set in `docker-compose.yml` for local development.
- To run all services with Docker Compose:
  ```sh
  docker-compose up --build
  ```
- All services should start and communicate as expected.

## Impact of Changes
- Changes may affect reply generation, ticket creation, and notification workflows.
- API changes may require updates in dependent services and clients.

## Setup & Usage
- Run with `python main.py` or via Makefile orchestration.
- Ensure all dependent microservices and AI/LLM access are available.
- Copy `.env.example` to `.env` and configure endpoints as needed.

---

See the backend README for unified setup, test, and orchestration commands.
