// Example Apple API model for an App Store app (response shape)
export interface AppStoreApp {
  id: string;
  type: string;
  attributes: {
    name: string;
    bundleId: string;
    sku: string;
    primaryLocale: string;
    // ...add more fields as needed from the OpenAPI spec
  };
  // ...add relationships, links, etc. as needed
}
