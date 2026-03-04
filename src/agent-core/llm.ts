import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { getEnvVariable } from "./env.js";

const openrouter = createOpenAICompatible({
  name: "openrouter",
  apiKey: getEnvVariable("OPENROUTER_API_KEY"),
  baseURL: `https://openrouter.ai/api/v1`,
});

export const models = {
  compactor: openrouter("google/gemini-2.5-flash-lite"),
};
