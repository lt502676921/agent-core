import { tool } from "ai";
import type { ToolExecutor } from "../agent-core/types.js";
import { z } from "zod";

const description = `Use this tool to output your thoughts step by step, which can be used to generate a plan or outline.`;

const inputSchema = z.object({
  content: z.string().describe("your thoughts"),
});

const outputSchema = z.object({
  status: z.string().describe("the status of the thought process"),
});

export const thinkingTool = tool({
  description,
  inputSchema,
  outputSchema,
});

export const thinkingExecutor: ToolExecutor<
  z.infer<typeof inputSchema>,
  z.infer<typeof outputSchema>
> = async () => {
  return {
    type: "tool-result",
    payload: { status: `done` },
  };
};
