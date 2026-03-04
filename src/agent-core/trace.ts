import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseExporter } from "langfuse-vercel";
import { getEnvVariable } from "./env.js";

const secretKey = getEnvVariable("LANGFUSE_SECRET_KEY");
const publicKey = getEnvVariable("LANGFUSE_PUBLIC_KEY");
const baseUrl = getEnvVariable("LANGFUSE_BASE_URL");

if (!secretKey || !publicKey || !baseUrl) {
  console.warn(
    "Warning: LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, or LANGFUSE_BASE_URL is not set. Langfuse tracing may not work correctly."
  );
}

const exporter = new LangfuseExporter({
  ...(secretKey && { secretKey }),
  ...(publicKey && { publicKey }),
  ...(baseUrl && { baseUrl }),
});

export const metricsSdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});
