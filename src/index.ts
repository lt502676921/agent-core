import 'dotenv/config';
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { useAgent, removeAgent } from "./use-agent.js";
import { metricsSdk } from './agent-core/trace.js';

metricsSdk.start();

async function main() {
  const userId = "cli-user"; // 终端版只有一个用户
  const rl = readline.createInterface({ input, output });

  console.log("=========================================");
  console.log("       🤖 Agent Core CLI Chatbot         ");
  console.log("=========================================");
  console.log("提示: 输入你的问题并按回车。输入 'exit' 退出。");
  console.log("-----------------------------------------\n");

  // 1. 获取（或初始化）用户的会话
  const session = await useAgent(userId);
  let historyLengthObj = (await session.agentLoop.getMessages()).length; // 追踪之前有多少条消息

  while (true) {
    const userInput = await rl.question("> You: ");
    const text = userInput.trim();

    if (!text) continue;
    if (text.toLowerCase() === "exit" || text.toLowerCase() === "quit") {
      console.log("\n再见 👋");
      break;
    }

    // 2. 将用户的输入提交进 Agent
    await session.agentLoop.userInput([
      {
        role: "user",
        content: [{ type: "text", text }],
      },
    ]);

    // 每次用户提交后，先更新当前的消息总数基准
    historyLengthObj = (await session.agentLoop.getMessages()).length;

    try {
      // 3. 驱动 Agent 思考和执行
      let isAgentTurn = true;
      while (isAgentTurn) {
        // 让 Agent 继续执行下一步（可能产生发言，可能调用工具）
        const agentResponse = await session.agentLoop.next();

        // 获取最新的所有消息
        const messages = await session.agentLoop.getMessages();

        // 我们只需打印上一次由于 `next()` 产生的新增消息即可
        if (messages.length > historyLengthObj) {
          const newMessages = messages.slice(historyLengthObj);

          for (const msg of newMessages) {
            if (msg.role === "assistant" && Array.isArray(msg.content)) {
              // 处理 assistant 的各种输出类型 (比如文本、或者某些插件卡片)
              const textPart = msg.content.find((c: any) => c.type === "text") as any;
              if (textPart && textPart.text) {
                console.log(`\n🤖 AI: ${textPart.text}`);
              }
            } else if (msg.role === "tool") {
              console.log(`👉 [内部系统] 执行了工具完毕`);
            }
          }
          // 同步最新的计数基准
          historyLengthObj = messages.length;
        }

        // 💡 打印当前的上下文内容，压缩的 json
        console.log(`\n[🔍 调试信息] 当前上下文内容: ${JSON.stringify(messages)}\n`);

        // 处理一些非阻塞的卡点，比如需要用户确认
        if (agentResponse.copilotRequests && agentResponse.copilotRequests.length > 0) {
          console.log("\n[Agent 请求 Copilot 用户协助/确认]，本 CLI 简化跳过...");
          break;
        }

        // 什么时候应该停下来等用户继续说话？
        if (agentResponse.actor === "user") {
          isAgentTurn = false;
        }
      }
    } catch (error) {
      console.error("\n❌ Agent 执行期间发生错误:", error);
    }
    console.log(""); // 输出一个空行，为了UI排版好看
  }

  // 释放资源
  rl.close();
  removeAgent(userId);
}

// 启动 CLI
if (process.env.NODE_ENV !== "production") {
  main().catch(console.error);
}