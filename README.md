# RepliQ: Turning Customer Feedback into Action with AI

RepliQ is an innovative project designed to transform customer feedback into actionable insights using the power of AI. By leveraging advanced machine learning models and a microservices-based architecture, RepliQ enables businesses to analyze, process, and act on customer reviews efficiently.

For a detailed narrative about the vision and journey of RepliQ, read our [blog post on Medium](https://medium.com/@jageenshukla/repliq-turning-customer-feedback-into-action-with-ai-16df6bfd49be).

## Project Overview
RepliQ is being developed in multiple phases:

### Phase 1: Multi-language Review Processing
- **Status:** Completed
- **Description:**
  - Multi-language review processing, sentiment analysis, issue/feature extraction, and personalized replies.
  - For more details, refer to the [backend README](./repliq-backend/README.md).
  - A dedicated blog post with full source code is coming next week.

### Phase 2: Direct Integration with JIRA and Confluence
- **Status:** In Progress
- **Description:**
  - Automates ticket creation and documentation updates by integrating directly with JIRA and Confluence.

### Phase 3: Full Context Awareness
- **Status:** Planned
- **Description:**
  - Links issues to releases, detects recurring bugs, and generates trend-based reports (e.g., most requested features, post-release bug spikes).
  - Enables smarter prioritization and release planning by mapping feedback to code modules, releases, and historical tickets.

## Code Structure
The repository is organized as follows:

- **`repliq-backend/`**: Contains all backend microservices for Phase 1.
  - Each service has its own folder with a `README.md` for detailed documentation.
  - Services include:
    - `api-gateway`: Main entry point for API requests.
    - `review-ingestion`: Handles ingestion of customer reviews.
    - `review-processing-py`: Processes reviews and performs AI-based analysis.
    - `notification`: Sends notifications based on processed reviews.

## How to Get Started
1. Clone the repository:
   ```sh
   git clone <your-repo-url>
   cd repliq-backend
   ```
2. Follow the instructions in the [backend README](./repliq-backend/README.md) to set up and run the backend services.

### Configuration and Setup

To run this project successfully, you need to configure the following:

1. **Database Connector**:  
   - Provide the necessary information for how `review-ingestion` communicates with the Apple Store API (`api.appstoreconnect.apple.com`).
   - Use the `setupDatabase.ts` script to configure the database. Before running the script, update the required fields in the script, such as:
     - `.p8` file path
     - Apple Key ID
     - Issuer ID
     - Bundle ID
     - App ID
     - Slack webhook URL
   - Run the script using:
     ```sh
     npm run setupdb-force
     ```
     or, if inside the container:
     ```sh
     node dist/scripts/setupDatabase.js --force
     ```

2. **Slack Webhook URL**:  
   - Create a Slack webhook URL by following the [Slack Webhooks Guide](https://api.slack.com/messaging/webhooks).
   - Add the webhook URL to the `setupDatabase.ts` script or `.env` file.

3. **Products Configuration**:  
   - Add product details, including the connector and notification channel, to identify the product ID.
   - Use the `setupDatabase.ts` script to populate the database with product information.

4. **OpenID Key and LLMs**:  
   - Configure the OpenID key for LLMs or set up the local Ollama model in Docker Compose to enable communication for the `review-processing` microservice.
   - Ensure the `OLLAMA_API_BASE` environment variable is set correctly in the `.env` file.

### Final Steps

Make sure `docker compose up` is running before proceeding with the following steps:

1. Verify all services are healthy by calling:  
   ```sh
   curl http://localhost:3000/health
   ```

2. Initiate the ingestion process by calling:  
   ```sh
   curl http://localhost:3001/api/reviews/ingest/<product-id>
   ```  
   This will fetch reviews, send notifications, and start the processing pipeline.

### Testing the Setup

1. Run automated tests to verify the setup:
   ```sh
   npm test
   ```
2. Check the test coverage reports in the `coverage/` folder for detailed results.

## Contributing
RepliQ is designed to be extensible. Developers can add new backend microservices or enhance existing ones. For detailed guidelines, refer to the `repliq-backend/README.md` file.

---

RepliQ is your gateway to turning customer feedback into actionable insights. Stay tuned for updates as we roll out the next phases of this exciting project!
