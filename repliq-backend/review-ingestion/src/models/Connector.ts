import { ObjectId } from 'mongodb';
import { z } from 'zod';

export const ConnectorSchema = z.object({
  type: z.string(),
  authType: z.string(),
  config: z.object({
    p8FilePath: z.string(),
    keyId: z.string(),
    issuerId: z.string(),
    bundleId: z.string(),
    appId: z.string(),
    apiUrl: z.string(),
  }),
  status: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Connector = z.infer<typeof ConnectorSchema> & { _id?: ObjectId };
