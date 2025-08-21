import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

export default {
  dialect: "postgresql",            // Required—identifies DB type
  schema: "./lib/db/schema.ts", // Path to your schema file
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
