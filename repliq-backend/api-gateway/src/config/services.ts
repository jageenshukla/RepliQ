// src/config/services.ts
// Service endpoints are loaded from environment variables for flexibility

export interface ServiceConfig {
  name: string;
  url: string;
  path: string;
  enabled: boolean;
}

export const services: ServiceConfig[] = [
  {
    name: 'review-ingestion',
    url: process.env.REVIEW_INGESTION_URL || 'http://review-ingestion:3001',
    path: '/review-ingestion',
    enabled: true
  },
  {
    name: 'review-processing',
    url: process.env.REVIEW_PROCESSING_URL || 'http://review-processing:3002',
    path: '/review-processing',
    enabled: true
  },
  {
    name: 'notification',
    url: process.env.NOTIFICATION_URL || 'http://notification:3004',
    path: '/notification',
    enabled: true
  },
  // Enable these when the services are ready:
  {
    name: 'jira-integration',
    url: process.env.JIRA_INTEGRATION_URL || 'http://jira-integration:3003',
    path: '/jira-integration',
    enabled: false
  },
  {
    name: 'approval',
    url: process.env.APPROVAL_URL || 'http://approval:3005',
    path: '/approval',
    enabled: false
  },
  {
    name: 'semantic-search',
    url: process.env.SEMANTIC_SEARCH_URL || 'http://semantic-search:3006',
    path: '/semantic-search',
    enabled: false
  },
  {
    name: 'feature-spec',
    url: process.env.FEATURE_SPEC_URL || 'http://feature-spec:3007',
    path: '/feature-spec',
    enabled: false
  }
];