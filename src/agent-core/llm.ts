import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { getEnvVariable } from "./env.js";

const apiKey = getEnvVariable("OPENROUTER_API_KEY");

if (!apiKey) {
  throw new Error("Missing required environment variable: OPENROUTER_API_KEY");
}

const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: `https://openrouter.ai/api/v1`,
  apiKey,
});

export const models = {
  compactor: openrouter("google/gemini-2.5-flash-lite"),
};
