import { Hono } from "hono";
import "dotenv/config"; // 載入 .env 檔
import { serve } from "@hono/node-server";
import { Client } from "@line/bot-sdk";
import axios from "axios";
import OpenAI from "openai";
import { connectDB } from "./mongo.js";

const app = new Hono();
const openAIclient = new OpenAI();

// 從 LINE Developers 拿到的
const config = {
  channelAccessToken: process.env.TOKEN,
  channelSecret: process.env.SECRET,
};
const lineClient = new Client(config);

// Webhook 接收訊息
app.post("/", async (c) => {
  const body = await c.req.json(); // 解析 JSON
  const events = body.events;
  const db = await connectDB();

  for (let event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const word = event.message.text.trim();
      const result = await generateDefinition(word);
      await db.collection("vocabulary").insertOne({
        ...result,
        createdAt: new Date(),
      });

      await lineClient.replyMessage(event.replyToken, {
        type: "text",
        text: `「${result.word}」

${result.meaning_zh}

${result.meaning_en}

🚩例句：

1. ${result.examples[0]}

2. ${result.examples[1]}
        `,
      });
    }
  }

  // 一定要回 200，否則 LINE 會報錯
  return c.text("OK", 200);
});

async function generateDefinition(word) {
  try {
    // 呼叫 OpenAI API
    const response = await openAIclient.responses.create({
      model: "gpt-4o-mini",
      input: `
你是一位英文老師，請極度嚴格依照以下 JSON 格式輸出：
{
  "word": string,       // 單字
  "meaning_zh": string, // 繁體中文解釋
  "meaning_en": string, // 英文解釋
  "examples": string[]  // 例句，請給兩個例句
}

查詢的單字：${word}

請只輸出 JSON，不要額外文字。
如查詢不到單字，請輸出 null
`,
    });

    return JSON.parse(response.output[0].content[0].text);
  } catch (error) {
    return `${error}`;
  }
}

// "OpenAI API 請求失敗"
// 查單字（用免費 API 例如 Dictionary API）
async function lookupWord(word) {
  try {
    const res = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    const definitions = res.data[0]?.meanings[0]?.definitions;
    if (!definitions) return `找不到單字「${word}」的解釋`;
    return definitions[0].definition; // 只回第一個定義
  } catch (err) {
    return `查詢「${word}」時出錯`;
  }
}

// serve({
//   fetch: app.fetch,
//   port: process.env.PORT || 3000,
// });

// console.log(`🚀 Server is running at http://localhost:${process.env.PORT}`);

export default app; // Vercel Hono 必須 export 預設 app
