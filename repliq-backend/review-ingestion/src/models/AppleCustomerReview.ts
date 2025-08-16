import { z } from 'zod';

export const AppleCustomerReviewSchema = z.object({
  id: z.string(),
  type: z.string(),
  attributes: z.object({
    rating: z.number().optional(),
    value: z.string().optional(), // review text
    title: z.string().optional(),
    reviewerNickname: z.string().optional(),
    territory: z.string().optional(),
    createdDate: z.string().optional(),
    // Add more fields as needed from the Apple API response
  }),
  // relationships, links, etc. can be added if needed
});

export type AppleCustomerReview = z.infer<typeof AppleCustomerReviewSchema>;
