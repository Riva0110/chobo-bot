import "dotenv/config"; // 載入 .env 檔
import { Hono } from "hono";
import OpenAI from "openai";
import { serve } from "@hono/node-server";
import { Client } from "@line/bot-sdk";

import { connectDB } from "./mongo.js";
import { replyFormat, promptInput } from "./utils.js";

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
  const collection = db.collection("vocabulary");

  for (let event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const word = event.message.text.trim();

      let replyText;
      const resultFromDb = await collection.findOne({ word });

      if (resultFromDb) {
        replyText = replyFormat(resultFromDb);
      } else {
        const resultFromAI = await generateDefinition(word);

        if (resultFromAI.error || resultFromAI === null)
          replyText = `查無「${word}」的解釋`;

        if (resultFromAI && !resultFromAI.error) {
          replyText = replyFormat(resultFromAI);

          await db.collection("vocabulary").insertOne({
            ...resultFromAI,
            createdAt: new Date(),
          });
        }
      }

      await lineClient.replyMessage(event.replyToken, {
        type: "text",
        text: replyText,
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
      input: promptInput(word),
    });

    return JSON.parse(response.output[0].content[0].text);
  } catch (error) {
    return { error };
  }
}

// serve({
//   fetch: app.fetch,
//   port: process.env.PORT || 3000,
// });

// console.log(`🚀 Server is running at http://localhost:${process.env.PORT}`);

export default app; // Vercel Hono 必須 export 預設 app
