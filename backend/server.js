import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import OpenAI from "openai";
import { schemaList } from "./schemaList.js";
import { log } from "./logger.js";
import variables from "./variablesList.json" with {type: 'json'};
import configListJSON from "./configList.json" with {type: 'json'};

const app = express();
const http = createServer(app);
const io = new Server(http, { cors: { origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000" } });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

app.use(express.static("../frontend/dist"));

io.on("connection", (socket) => {
  socket.on("user_msg", async (text) => {
    const { message, theme, configs } = JSON.parse(text);
    
    const reply = await talkToLLM(message, theme, configs);
    if (reply.assistant_msg) socket.emit("assistant_msg", reply.assistant_msg);
    if (reply.call) socket.emit("tool_call", reply.call);
  });
});

function buildVariablesList() {
  return variables.map((variable) => `${variable.name}: ${variable.description}`).join("\n");
}

function buildConfigsList(configArr) {
  return configArr.map(config => `${config.name}: ${config.description}`).join('\n')
}

function buildThemeVariablesList(theme) {
  if(!theme.length || !Array.isArray(theme)) return '';
  return theme.map(variable => `${variable.key}: ${variable.value}`).join('\n');
}

function generateSystemPrompt(theme, configs) {
  const varList = buildVariablesList();
  const currentTheme = buildThemeVariablesList(theme);
  const currentConfigs = buildConfigsList(configs);
  const availableConfigs = buildConfigsList(configListJSON);

  return `You are **ProjectGanttAssistant**, your goal is to help the user operating DHTMLX Gantt chart using natural language commands.

Today is ${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}

Always use one tool call for one command.

Your replies will be displayed in chat side panel, so try to be short and clear. You can use markdown formatting.

You can customize the Gantt appearance using these CSS variables:
${varList}

Here are the available config options (gantt.config.*):
${availableConfigs}

When changing the current theme in some way (for example, making the task bars lighter) or adding new styles to the current theme, use the active theme CSS variables created earlier and update its variables according to the user's requirements, or add new variables.

Rules for changing the current theme:
1. **Never** delete, omit, or reorder existing variables from the theme.
2. Always return the **entire list of variables**, even if only one was changed.
3. Modify **only** those variables that are explicitly mentioned or clearly implied by the user's message.
4. If the user says something general (e.g. "make it darker"), update only the most relevant variables, but still preserve all others.

For example:
If the user says “Make the task background lighter,” you should only change the value of --dhx-gantt-task-background (if that's the relevant variable), and return all others unchanged.

Here is the current theme (DO NOT LOSE THIS — you will be modifying it):
${currentTheme}

Here are the current configs (DO NOT LOSE THIS — you will be modifying it):
${currentConfigs}

Remember to use tools in your replies.
`;
}

async function talkToLLM(request, theme, configs) {
  const messages = [
    { role: "system", content: generateSystemPrompt(theme, configs) },
    { role: "user", content: request },
  ];

  log.success("calling llm");
  const res = await openai.chat.completions.create({
    model: "gpt-5-nano",
    messages: messages,
    tools: schemaList,
  });

  log.success("Got LLM reply");
  log.info(
    `Processing took ${res.usage.approximate_total}. Prompt tokens: ${res.usage.prompt_tokens}, response tokens: ${res.usage.completion_tokens}, perf ${res.usage["response_token/s"]}T/s`
  );

  const msg = res.choices[0].message;
  let content = msg.content;
  let calls = msg.tool_calls;


  const toolCall = calls ? calls[0] : null;

  log.info(`output: ${content}`);
  log.info(`tool call: ${JSON.stringify(toolCall)}`);
  return {
    assistant_msg: content,
    call: toolCall
      ? JSON.stringify({ cmd: toolCall.function.name, params: JSON.parse(toolCall.function.arguments) })
      : null,
  };
}

http.listen(3001, () => console.log("API on :3001"));
