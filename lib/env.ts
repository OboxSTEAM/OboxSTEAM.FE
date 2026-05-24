import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url({
    error: "NEXT_PUBLIC_API_URL must be set in .env (see .env.example).",
  }),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
