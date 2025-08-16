# Technical Design: Review Ingestion Service

## 1. Overview
- The Review Ingestion Service is a Node.js (TypeScript) microservice responsible for fetching, deduplicating, and storing app store reviews for multiple products and sources (e.g., Apple Store, Google Play). It is the entry point for all external review data into the RepliQ platform.

**Purpose:**
- Automate the collection of user reviews from various app stores.
- Enforce deduplication to prevent duplicate processing and storage.
- Store reviews in MongoDB with a unique index on `{source, sourceReviewId}`.
- Trigger downstream processing (AI analysis, notifications, ticket creation) via internal service communication.
- Support both scheduled and manual ingestion triggers.
- Enable multi-product and multi-source support, with all configuration (products, sources, notification channels) stored in the database for flexibility and future UI integration.

**Scope:**
- Fetch reviews from Apple Store (initially), with Google Play and other sources planned.
- Integrate with notification (Slack/Teams), review-processing, semantic-search, and JIRA integration services.
- Provide a health check endpoint and other management APIs.
- All configuration is environment-driven and database-backed for extensibility.

**High-Level Architecture:**
```
                +-------------------+
                |  App Store APIs   |
                +-------------------+
                          |
                          v
                +-------------------------+
                |  Review Ingestion Svc   |
                +-------------------------+
                 |  - Fetch & deduplicate |
                 |  - Store in MongoDB    |
                 |  - Trigger downstream  |
                 +------------------------+
                  |        |         |
                  v        v         v
        +----------------+  +-------------------+  +-------------------+
        | review-processing|  | notification svc |  | semantic-search   |
        +----------------+  +-------------------+  +-------------------+
```
All services are orchestrated via Docker Compose and communicate over internal networks, with endpoints and credentials managed via environment variables.

## 2. Functional Requirements
- The Review Ingestion Service addresses the following features and user stories:

### Features
- Fetch reviews from Apple Store for a configured product (Google Play and other sources planned).
- Store reviews in MongoDB with deduplication enforced by a unique index on `{source, sourceReviewId}`.
- Support dynamic, database-driven configuration for products and sources.
- Support both scheduled and manual ingestion triggers.
- Provide a health check endpoint (`/health`).
- Integrate with notification service to send Slack/Teams notifications on new review ingestion.
- Trigger downstream processing (AI analysis, ticket creation, semantic search) via internal service communication.
- All configuration (product, source, notification channel) is stored in the database for flexibility and future UI/portal integration.
- CLI-first operation, with future UI planned.

### User Stories (from docs)
- As an admin, I want to fetch reviews for a specific product so that I can process them automatically.
- As a developer, I want reviews to be deduplicated so that we don’t process the same review twice.
- As a product owner, I want to configure product/source details in the database so that onboarding new products is easy.
- As a support agent, I want to receive a Slack notification when new reviews are ingested so I can stay updated.

### Additional Requirements (from Instruction.md)
- Each review must have a unique internal ID and a source review ID (with source type).
- Deduplication is enforced by a unique index on `{source, sourceReviewId}`.
- Notification logic must be abstracted to support multiple channels (Slack, Teams, etc.).
- Service must use strategy, factory, and dependency injection patterns for extensibility (adding new sources, products, notification channels).
- All AI/LLM logic must use Google ADK.
- All product, source, and notification configuration is stored in the database, not hardcoded.

## 3. Non-Functional Requirements
- The Review Ingestion Service must meet the following non-functional requirements:

### Performance
- Ingestion operations should complete within a few seconds for typical review batches (up to 100 reviews per request).
- Deduplication and storage must not introduce significant latency.
- API endpoints should respond within 500ms under normal load.

### Reliability
- The service must be highly available and resilient to failures (e.g., app store API downtime, DB connection issues).
- All critical operations (fetch, store, notify) must be retried on transient errors.
- Errors and failures must be logged with sufficient detail for troubleshooting.

### Scalability
- The service must support scaling horizontally (multiple instances) to handle increased review volume or additional products/sources.
- MongoDB must be able to handle growth in review and configuration data.
- All configuration and state must be externalized (DB, environment variables) to support stateless operation.

### Security
- All sensitive configuration (API keys, DB credentials) must be stored in environment variables or secure secrets management.
- Only authenticated and authorized internal services should be able to trigger ingestion or access management endpoints.
- Input validation and sanitization must be enforced for all external data (reviews, configuration).

### Maintainability
- Codebase must use TypeScript and follow project coding standards.
- Use of strategy, factory, and dependency injection patterns for extensibility.
- All business logic must be covered by unit and integration tests.

### Observability
- Service must provide structured logging for all major operations and errors.
- Expose health and readiness endpoints for monitoring.
- Metrics (e.g., ingestion count, error rate) should be available for future integration with monitoring tools.

## 4. Data Flow & Sequence Diagrams
- The following describes the step-by-step data flow and sequence for review ingestion, deduplication, and storage:

### Step-by-Step Data Flow
1. **Trigger Ingestion**
   - Ingestion is triggered either by a scheduled job (cron) or a manual API/CLI call.
2. **Fetch Reviews**
   - The service fetches reviews from the configured app store API (e.g., Apple Store) for each product/source in the database.
3. **Deduplicate Reviews**
   - For each fetched review, the service checks MongoDB for an existing document with the same `{source, sourceReviewId}`.
   - Only new (not previously stored) reviews are processed further.
4. **Store Reviews**
   - New reviews are inserted into the `reviews` collection in MongoDB, with a unique index on `{source, sourceReviewId}` to enforce deduplication.
5. **Trigger Downstream Processing**
   - For each new review, the service triggers downstream processing (e.g., sends a message/event to review-processing, notification, and semantic-search services).
6. **Send Notification**
   - A summary or notification is sent to the configured Slack/Teams channel via the notification service.
7. **Log and Monitor**
   - All operations, errors, and metrics are logged for observability and monitoring.

### Sequence Diagram (Textual)
```
User/API/Cron
   |
   | (1) Trigger Ingestion
   v
Review Ingestion Service
   | (2) Fetch reviews from App Store API
   v
App Store API
   | (3) Return reviews
   v
Review Ingestion Service
   | (4) Deduplicate & store new reviews in MongoDB
   v
MongoDB
   | (5) Store successful
   v
Review Ingestion Service
   | (6) Trigger downstream processing (review-processing, notification, semantic-search)
   v
Other Services
   | (7) Send notification to Slack/Teams
   v
Notification Service
```

This flow ensures that only new reviews are processed, all operations are logged, and downstream services are notified in real time.

## 5. API Design
- The Review Ingestion Service exposes the following HTTP API endpoints:

### 1. Health Check
- **Endpoint:** `GET /health`
- **Description:** Returns service health status.
- **Response:**
  ```json
  { "status": "ok" }
  ```
- **Status Codes:**
  - 200 OK

### 2. Manual Ingestion Trigger
- **Endpoint:** `POST /ingest`
- **Description:** Triggers review ingestion for all configured products/sources. Can be called manually (e.g., via curl or CLI script).
- **Request Body:** *(optional)*
  ```json
  { "productId": "string", "source": "string" }
  ```
  - If omitted, triggers ingestion for all products/sources.
- **Response:**
  ```json
  { "ingested": 12, "skipped": 3, "errors": 0 }
  ```
- **Status Codes:**
  - 200 OK: Ingestion completed
  - 400 Bad Request: Invalid input
  - 500 Internal Server Error: Unexpected failure

### 3. List Reviews (for debugging/ops)
- **Endpoint:** `GET /reviews`
- **Description:** Returns a paginated list of ingested reviews (for debugging/ops, not for production use).
- **Query Params:**
  - `productId` (optional)
  - `source` (optional)
  - `limit` (default: 20)
  - `offset` (default: 0)
- **Response:**
  ```json
  {
    "reviews": [
      {
        "_id": "string",
        "productId": "string",
        "source": "apple",
        "sourceReviewId": "string",
        "author": "string",
        "rating": 5,
        "title": "string",
        "body": "string",
        "timestamp": "2025-07-12T12:00:00Z"
      }
    ],
    "total": 1
  }
  ```
- **Status Codes:**
  - 200 OK
  - 400 Bad Request

### Error Codes
- 400: Invalid input, missing required fields
- 404: Resource not found (if applicable)
- 500: Internal server error

### Example curl Requests
```sh
# Health check
curl http://localhost:3001/health

# Trigger ingestion for all products/sources
curl -X POST http://localhost:3001/ingest

# Trigger ingestion for a specific product/source
curl -X POST http://localhost:3001/ingest -H 'Content-Type: application/json' -d '{"productId":"abc123","source":"apple"}'

# List reviews for a product
curl 'http://localhost:3001/reviews?productId=abc123&limit=10'
```

## 6. Integration Points
- The Review Ingestion Service integrates with the following systems:

### External APIs
- **Apple Store API:** Used to fetch reviews for configured products. Requires API credentials and product identifiers.
- **Google Play API:** Planned for future support; similar integration pattern as Apple Store.

### Internal Services
- **review-processing:** Receives new reviews for AI analysis and further processing (e.g., sentiment, categorization).
- **notification:** Receives events to send notifications (Slack, Teams, etc.) when new reviews are ingested.
- **semantic-search:** Receives new reviews for indexing and enables semantic search for similar complaints.
- **jira-integration:** (Future) For creating and tracking JIRA tickets based on actionable reviews.

### Communication Patterns
- Internal services communicate via HTTP APIs or message/event bus (future enhancement).
- All service endpoints are configured via environment variables for flexibility and portability.

### Environment Variable Configuration
- **Service Endpoints:** URLs/ports for all dependent services (e.g., NOTIFICATION_SERVICE_URL, REVIEW_PROCESSING_URL).
- **Database:** MongoDB connection string (MONGODB_URI).
- **API Credentials:** App store API keys/secrets (APPLE_API_KEY, GOOGLE_API_KEY, etc.).
- **Scheduling:** Cron expression for scheduled ingestion (INGEST_CRON).
- **Notification:** Default notification channel, webhook URLs, etc.
- **Other:** PORT, LOG_LEVEL, and any feature flags.

All environment variables should be documented in `.env.example` and referenced in the README for onboarding.


## 7. Database Design

The Review Ingestion Service uses MongoDB to store reviews and configuration data. To maximize reusability and security, connectors (for review sources) and notification channels are managed in separate collections and referenced by products.

### Reviews Collection
**Collection Name:** `reviews`


**Schema:**
```json
{
  "_id": "ObjectId (auto-generated)",
  "productId": "string",           // Internal product identifier
  "source": "string",              // e.g., 'apple', 'google'
  "sourceReviewId": "string",      // Review ID from the source
  "author": "string",
  "rating": "number",
  "title": "string",
  "body": "string",
  "timestamp": "ISODate",
  "raw": "object",                 // (optional) Raw review payload for traceability
  "createdAt": "ISODate",
  "updatedAt": "ISODate",
  "lastSeenAt": "ISODate (optional)", // (optional) Last time this review was seen, for updates/edits
  "version": "number (optional)"       // (optional) Version or edit count, if supported by source
}
```
*Note: `lastSeenAt` and `version` are optional and should be set only if available from the source. Their absence will not cause errors.*

**Indexes:**
- Unique index on `{ source, sourceReviewId }` to enforce deduplication.
- Index on `productId` for efficient queries by product.

### Products Collection
**Collection Name:** `products`

**Schema:**
```json
{
  "_id": "ObjectId (auto-generated)",
  "productId": "string",           // Internal product identifier
  "name": "string",                // Product name
  "description": "string",
  "connectorIds": ["ObjectId"],    // References to connectors used by this product
  "notificationChannelIds": ["ObjectId"], // References to notification channels
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- Unique index on `productId`.

### Connectors Collection
**Collection Name:** `connectors`

**Schema:**
```json
{
  "_id": "ObjectId (auto-generated)",
  "type": "string",                // e.g., 'apple', 'google', etc.
  "authType": "string",            // e.g., 'jwt', 'oauth', etc.
  "config": {
    // Example for Apple Store
    "p8FilePath": "/secrets/apple/key.p8",
    "keyId": "ABC123",
    "issuerId": "DEF456",
    "bundleId": "com.example.myapp",
    "apiUrl": "https://api.appstoreconnect.apple.com/v1/"
    // Example for Google Play would have different fields
  },
  "status": "string",              // e.g., 'active', 'inactive'
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### Notification Channels Collection
**Collection Name:** `notificationChannels`

**Schema:**
```json
{
  "_id": "ObjectId (auto-generated)",
  "type": "string",                // e.g., 'slack', 'teams', etc.
  "config": {
    // Example for Slack
    "webhookUrl": "https://hooks.slack.com/services/...",
    "channelName": "#alerts"
    // Example for Teams would have different fields
  },
  "status": "string",              // e.g., 'active', 'inactive'
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

**Indexes:**
- Unique index on relevant fields as needed (e.g., `webhookUrl` for Slack, etc.).

### Deduplication Strategy
- Deduplication is enforced at the database level by a unique index on `{ source, sourceReviewId }` in the `reviews` collection.
- Before inserting a new review, the service checks for an existing document with the same keys; if found, the review is skipped.
- This ensures idempotency and prevents duplicate processing even if the ingestion job is retried or receives overlapping data.

## 8. Scheduling & Triggers

The Review Ingestion Service supports both scheduled (automated) and manual (on-demand) ingestion of reviews for all configured products and sources.

### Scheduled Ingestion
- **Mechanism:**
  - A background scheduler (e.g., node-cron or a similar library) runs within the service container.
  - The schedule is defined by a cron expression, configurable via the `INGEST_CRON` environment variable (e.g., every hour, every 15 minutes).
  - On each trigger, the service fetches reviews for all active products and sources using their configured connectors.
- **Configuration:**
  - The cron schedule is set in environment variables for easy adjustment without code changes.
  - Example: `INGEST_CRON=0 * * * *` (every hour)
- **Extensibility:**
  - The scheduler can be paused, resumed, or reconfigured at runtime (future enhancement).
  - Support for per-product or per-source scheduling can be added if needed.

### Manual Ingestion
- **Mechanism:**
  - Exposed via the `POST /ingest` API endpoint.
  - Can be triggered by an admin, CLI, or other internal service.
  - Supports optional parameters to ingest for a specific product and/or source, or all if omitted.
- **Use Cases:**
  - Onboarding a new product/source.
  - Ad-hoc re-ingestion (e.g., after fixing a connector or updating credentials).
  - Debugging or operational intervention.

### Ingestion Flow (Common to Both)
1. **Fetch Configuration:**
   - Load all active products, connectors, and sources from the database.
2. **Iterate and Fetch:**
   - For each product and source, use the appropriate connector to fetch reviews, sorted by date (newest first).
3. **Deduplicate and Store:**
   - Insert new reviews into the database until a duplicate is found (see deduplication strategy).
4. **Trigger Downstream:**
   - For each new review, trigger downstream processing and notifications as described earlier.
5. **Logging and Metrics:**
   - Log all operations, errors, and metrics for observability.

### Error Handling
- If a scheduled ingestion fails for a product/source, errors are logged and retried on the next scheduled run.
- Manual ingestion returns detailed status in the API response (ingested, skipped, errors).

### Future Enhancements
- Support for distributed/clustered scheduling (e.g., with a message queue or external scheduler).
- Per-product/source custom schedules.
- UI for managing and monitoring ingestion jobs.

## 9. Error Handling & Logging

Robust error handling and structured logging are critical for reliability, maintainability, and observability of the Review Ingestion Service. This section outlines the approach for handling errors, implementing retries, and logging key events and failures.

### Error Scenarios
- **External API Failures:**
  - App store APIs (Apple, Google, etc.) may be unavailable, rate-limited, or return errors.
  - Network issues, invalid credentials, or expired tokens.
- **Database Errors:**
  - MongoDB connection failures, timeouts, or write errors (e.g., duplicate key violations).
- **Downstream Service Failures:**
  - Notification, review-processing, or semantic-search services may be unavailable or return errors.
- **Configuration Errors:**
  - Missing or invalid connector/notification configuration, environment variables, or credentials.
- **Data Validation Errors:**
  - Malformed or unexpected review data from external sources.

### Retry Logic
- **Transient Errors:**
  - For transient errors (e.g., network timeouts, 5xx API responses), implement exponential backoff retries (e.g., up to 3 attempts with increasing delay).
  - Retries are applied to external API calls, database writes, and downstream service invocations.
- **Permanent Errors:**
  - For permanent errors (e.g., invalid credentials, schema violations), log the error and skip the affected item. Do not retry until configuration is fixed.
- **Scheduled Ingestion:**
  - If a scheduled ingestion run fails for a product/source, the error is logged and retried on the next scheduled run.
- **Manual Ingestion:**
  - Manual ingestion returns a detailed status, including which items failed and why.

### Logging Approach
- **Structured Logging:**
  - Use a structured logging library (e.g., Winston, Pino) to emit logs in JSON format for easy parsing and integration with log management tools.
  - Include context such as timestamps, product/source IDs, operation type, error codes, and stack traces.
- **Log Levels:**
  - Use appropriate log levels: `info` (normal operations), `warn` (recoverable issues), `error` (failures), `debug` (detailed troubleshooting).
- **Key Events to Log:**
  - Ingestion start/end, number of reviews fetched/ingested/skipped.
  - API call failures, retries, and final outcomes.
  - Database errors (e.g., duplicate key, connection issues).
  - Downstream service invocation results.
  - Configuration or validation errors.
- **Sensitive Data:**
  - Never log sensitive information (API keys, tokens, PII). Mask or redact as needed.

### Monitoring and Alerting
- Integrate logs with monitoring/alerting tools (e.g., ELK, Datadog, Prometheus) to detect and alert on error spikes, ingestion failures, or abnormal patterns.
- Expose health and readiness endpoints for liveness checks and automated monitoring.

### Example Error Handling Flow
1. Attempt to fetch reviews from an external API.
2. If a transient error occurs, retry with exponential backoff.
3. If all retries fail, log an error with context and continue to the next product/source.
4. For each review, attempt to insert into MongoDB; on duplicate key, log as skipped.
5. On downstream service failure, log and retry if appropriate; otherwise, mark as failed for later reprocessing.

### Best Practices
- Centralize error handling and logging logic for consistency.
- Use correlation IDs to trace requests across services.
- Regularly review logs and metrics to identify recurring issues and improve reliability.

## 10. Security Considerations

Security is a core requirement for the Review Ingestion Service, given its handling of sensitive credentials, API keys, and potentially user data. The following measures are implemented:

### Authentication & Authorization
- **Internal API Protection:**
  - All management and ingestion endpoints are protected and accessible only to authenticated internal services or authorized users (e.g., via API keys, JWT, or mTLS).
- **Role-Based Access:**
  - Future support for role-based access control (RBAC) to restrict sensitive operations (e.g., configuration changes, manual ingestion) to admins.

### Sensitive Data Handling
- **Environment Variables:**
  - All secrets (API keys, DB credentials, .p8 file paths, webhooks) are stored in environment variables or a secure secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault).
- **Database Encryption:**
  - Sensitive fields in the database (if any) are encrypted at rest.
- **No Logging of Secrets:**
  - Sensitive data is never logged. Logs are reviewed to ensure no accidental leakage.
- **Input Validation & Sanitization:**
  - All external data (reviews, configuration) is validated and sanitized to prevent injection attacks.
- **Least Privilege:**
  - Service accounts and DB users are granted only the minimum permissions required.

### Network Security
- **Internal-Only Exposure:**
  - The service is exposed only on internal networks (e.g., Docker Compose, Kubernetes), not directly to the public internet.
- **TLS Everywhere:**
  - All inter-service and database communication uses TLS encryption.

### Compliance
- **PII Handling:**
  - If reviews contain PII, data handling complies with relevant regulations (e.g., GDPR, CCPA).


## 11. Deployment & Configuration

The Review Ingestion Service is designed for easy deployment, configuration, and local development.

### Environment Variables
- All configuration (API keys, DB URIs, cron schedules, service endpoints) is managed via environment variables.
- A `.env.example` file documents all required variables for onboarding.

### Docker & Containerization
- The service runs as a Docker container, orchestrated via Docker Compose for local and multi-service setups.
- Example `docker-compose.yml` includes MongoDB, the review-ingestion service, and other dependencies.
- Health checks are defined for readiness/liveness.

### Local Development
- Developers can run the service locally using Node.js and Docker Compose.
- Mock connectors and test data are provided for local testing without real API keys.

### CI/CD
- Automated builds and tests are run via CI (e.g., GitHub Actions, GitLab CI).
- Linting, unit tests, and integration tests are required for all pull requests.
- Images are built and pushed to a container registry.
- Deployments are automated to staging/production environments.

### Configuration Management
- All configuration is externalized; no secrets or environment-specific values are hardcoded.
- Future support for dynamic config reloads and secrets rotation.


## 12. Testing Strategy

Testing is critical to ensure reliability, correctness, and maintainability.

### Unit Testing
- All business logic, connectors, and utility functions are covered by unit tests (e.g., using Jest).
- Mock external APIs and database calls to isolate logic.

### Integration Testing
- Integration tests cover end-to-end flows: fetching reviews, deduplication, storage, and downstream triggers.
- Use test containers or in-memory MongoDB for integration tests.
- Test error scenarios, retries, and edge cases.

### End-to-End (E2E) Testing
- E2E tests validate the full system, including real or mocked external APIs, database, and downstream services.
- Simulate real-world ingestion, notification, and error flows.

### Test Coverage & Automation
- Code coverage is tracked and enforced in CI.
- All tests are automated and run on every commit/PR.

### Manual Testing
- Manual tests are performed for onboarding new connectors, notification channels, and major releases.


## 13. Future Enhancements

The following features are planned or considered for future releases:

- **Google Play and Other Sources:**
  - Add connectors for Google Play, Amazon, and other review sources.
- **Advanced Deduplication:**
  - Fuzzy matching, duplicate detection across sources, and review updates/edits.
- **Distributed Scheduling:**
  - Support for clustered/distributed ingestion jobs (e.g., with message queues).
- **UI/Portal:**
  - Web UI for managing products, connectors, notification channels, and monitoring ingestion jobs.
- **Role-Based Access Control (RBAC):**
  - Fine-grained permissions for different user roles.
- **Secrets Management Integration:**
  - Native integration with cloud secrets managers for runtime secrets.
- **Audit Logging:**
  - Detailed audit trails for configuration changes and sensitive operations.
- **Self-Healing & Auto-Retry:**
  - Automated recovery from common failures, smarter retry policies.
- **Multi-Tenancy:**
  - Support for multiple organizations/products in a single deployment.


## 14. Open Questions & Assumptions

This section tracks open questions, design assumptions, and areas needing further clarification:

- **Connector Extensibility:**
  - What is the best pattern for adding new connector types (e.g., plugin system, codegen, config-driven)?
- **Notification Channel Flexibility:**
  - How to best support custom notification logic or third-party integrations?
- **Review Updates/Edits:**
  - How should the system handle review edits or deletions from sources that support them?
- **Scaling MongoDB:**
  - What are the long-term scaling strategies for MongoDB as review volume grows?
- **Secrets Rotation:**
  - How to automate secrets rotation and minimize downtime?
- **Monitoring & Alerting:**
  - What are the best tools and practices for real-time monitoring and alerting?
- **Compliance:**
  - Are there additional compliance requirements (GDPR, CCPA, etc.) for review data?

Assumptions:
- All external APIs provide unique, stable review IDs.
- All downstream services are available on the internal network.
- Environment variables and secrets are managed securely.
