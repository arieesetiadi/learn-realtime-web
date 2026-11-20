import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    LARAVEL_API_URL: z.string().url(),
  },
  client: {
    NEXT_PUBLIC_REVERB_APP_KEY: z.string().min(1),
    NEXT_PUBLIC_REVERB_HOST: z.string().min(1),
    NEXT_PUBLIC_REVERB_PORT: z.coerce.number().int().positive(),
    NEXT_PUBLIC_REVERB_SCHEME: z.enum(["http", "https"]),
  },
  runtimeEnv: {
    LARAVEL_API_URL: process.env.LARAVEL_API_URL,
    NEXT_PUBLIC_REVERB_APP_KEY: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    NEXT_PUBLIC_REVERB_HOST: process.env.NEXT_PUBLIC_REVERB_HOST,
    NEXT_PUBLIC_REVERB_PORT: process.env.NEXT_PUBLIC_REVERB_PORT,
    NEXT_PUBLIC_REVERB_SCHEME: process.env.NEXT_PUBLIC_REVERB_SCHEME,
  },
  emptyStringAsUndefined: true,
});
