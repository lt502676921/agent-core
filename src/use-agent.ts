import { MemoryClient } from 'mem0ai';
import { LangfuseClient } from '@langfuse/client';
import { AgentLoop, type AgentLoopOptions } from './agent-core/index.js';
import { models } from './llm.js';
import { SYSTEM_WORKFLOW } from './prompts/system.js';
import { thinkingExecutor, thinkingTool } from './tools/thinking-tool.js';
import { randomSessionId } from './utils.js';
import { webSearch, webSearchExecutor } from './tools/web-search.js';

export const langfuseClient = new LangfuseClient();

export const mem0Client = new MemoryClient({ apiKey: process.env.MEM0_API_KEY! });

const toolDefs: AgentLoopOptions['toolDefs'] = {
  thinking: thinkingTool,
  webSearch,
};

const toolExecutors: AgentLoopOptions['toolExecutors'] = {
  thinking: thinkingExecutor,
  webSearch: webSearchExecutor,
};

// ====== Mock 获取 System 和 Memory 的方法 ======
export const getSystemInstruction = async (memory: string, skillsPrompt: string | null) => {
  let systemInstruction = SYSTEM_WORKFLOW({ currentMemory: memory });

  try {
    // 从 prompt management 获取 prompt
    const prompt = await langfuseClient.prompt.get('Chloe', { type: 'text' });

    systemInstruction = prompt.compile({
      memory: `${
        memory
          ? `# User preferences

The following preferences were emphasized in prior interactions; please follow them:
${memory}`
          : ''
      }`,
      skillsPrompt: `${
        skillsPrompt
          ? `# Available skills
The following skills are available to you for use during this session:
${skillsPrompt}`
          : ''
      }`,
    });
  } catch (error) {}

  return systemInstruction;
};

export const mockGetMemory = async (userId: string) => {
  // 从 mem0 获取 memory
  // const memoryResults = await mem0Client.search(searchQuery, {
  //   user_id: userId,
  // });

  return '';
};
// ===============================================

export interface UserSession {
  sessionId: string;
  agentLoop: AgentLoop;
  memory: string;
  abortController: AbortController;
}

// 用户 ID 映射到对应的 Session 对象
// 注意：未来如果你接入 Redis 等缓存，可能需要持久化 Messages 而不是整个 AgentLoop 实例。但在单机多用户层面上，这个 Map 的设计完全够用。
const userSessions = new Map<string, UserSession>();

/**
 * 获取或创建用户对应的 Agent 会话
 * @param userId 用户唯一标识
 */
export const useAgent = async (userId: string): Promise<UserSession> => {
  // 1. 如果存在，直接返回这个对象实例，使用方可以利用实例拿到刚才的上下文
  if (userSessions.has(userId)) {
    return userSessions.get(userId)!;
  }

  // 2. 如果不存在，创建一个新的实例，同时可以生成 sessionId 作为本次会话的追踪 ID
  const sessionId = randomSessionId();
  const abortController = new AbortController();
  const memory = await mockGetMemory(userId);

  const systemInstruction = await getSystemInstruction(memory, null);

  const agentLoop = new AgentLoop({
    systemInstruction,
    model: models.main,
    abortSignal: abortController.signal,
    toolDefs,
    toolExecutors,
    telemetry: {
      isEnabled: true,
      functionId: 'test-agent-core',
      metadata: {
        sessionId: `test-${sessionId}`,
        userId,
      },
    },
  });

  const session: UserSession = {
    sessionId,
    agentLoop,
    memory,
    abortController,
  };

  userSessions.set(userId, session);

  return session;
};

/**
 * 停止并清理用户的 Agent 会话
 */
export const removeAgent = (userId: string) => {
  const session = userSessions.get(userId);
  if (session) {
    session.abortController.abort();
    userSessions.delete(userId);
  }
};
