import { tool } from 'ai';
import { z } from 'zod';
import { Exa } from 'exa-js';
import type { ToolExecutor } from '../agent-core/types.js';

export const exa = new Exa(process.env.EXA_API_KEY);

const EXA_SEARCH_OPTIONS = {
  type: 'auto' as const,
  numResults: 5,
  contents: {
    text: true as const,
    livecrawl: 'always' as const,
  },
};

export const webSearch = tool({
  description: 'Search the web for up-to-date information',
  inputSchema: z.object({
    query: z.string().min(1).max(100).describe('The search query'),
  }),
  execute: async ({ query }) => {
    const { results } = await exa.search(query, EXA_SEARCH_OPTIONS);
    return results.map((result: any) => ({
      title: result.title,
      url: result.url,
      content: result.text?.slice(0, 3000) ?? '',
      publishedDate: result.publishedDate,
    }));
  },
});

export const webSearchExecutor: ToolExecutor = async (input: any) => {
  const { query } = input;
  const { results } = await exa.search(query, EXA_SEARCH_OPTIONS);
  return {
    type: 'tool-result',
    payload: results.map((result: any) => ({
      title: result.title,
      url: result.url,
      content: result.text?.slice(0, 3000) ?? '',
      publishedDate: result.publishedDate,
    })),
  };
};
