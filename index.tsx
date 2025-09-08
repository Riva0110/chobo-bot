/** @jsx jsx */

import { Hono } from "hono";
import { jsx } from "hono/jsx";

import { connectDB } from "./lib/db.js";
import { lineClient } from "./lib/lineClient.js";
import { replyFormat, generateDefinition, generateAudio } from "./utils.js";

const app = new Hono();

const Layout = ({ children }) => (
  <html>
    <head>
      <title>SSR with Hono</title>
    </head>
    <body>{children}</body>
  </html>
);

const Home = () => (
  <Layout>
    <h1>Hello, Hono + React SSR!</h1>
  </Layout>
);

app.get("/", (c) => {
  return c.html(String(<Home />));
});

// Webhook 接收訊息
app.post("/search-words", async (c) => {
  const body = await c.req.json(); // 解析 JSON
  const events = body.events;
  const db = await connectDB();
  const vocabulary = db.collection("vocabulary");
  const userRecord = db.collection("userRecord");

  for (let event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const groupId = event.source.groupId || event.source.userId;
      const word = event.message.text.replace(/[^a-zA-Z\s'-]/g, "").trim();

      let replyText = "";
      let replyAudio: { url: string; duration: number } | null = null;
      const resultFromDb = await vocabulary.findOne({ word });

      if (resultFromDb) {
        replyText = replyFormat(resultFromDb);
        const isSearched = await userRecord.findOne({ word, groupId });
        if (isSearched) {
          await userRecord.updateOne(
            { word, groupId },
            { $push: { history: { searchedAt: new Date() } } }
          );
        } else {
          await userRecord.insertOne({
            word,
            groupId,
            history: [{ searchedAt: new Date() }],
          });
        }
      } else {
        const resultFromAI = await generateDefinition(word);

        if (
          resultFromAI?.error ||
          resultFromAI === null ||
          resultFromAI === "null"
        )
          replyText = `查無「${word}」的解釋`;

        if (resultFromAI && !resultFromAI?.error) {
          replyText = replyFormat(resultFromAI);

          const audio = await generateAudio(word);
          if (!audio?.error && audio.url && audio.duration) {
            replyAudio = { url: audio.url, duration: audio.duration };
          }

          await vocabulary.insertOne({
            ...resultFromAI,
            ...(replyAudio && { audio }),
          });
          await userRecord.insertOne({
            word,
            groupId,
            history: [{ searchedAt: new Date() }],
          });
        }
      }

      await lineClient.replyMessage(event.replyToken, [
        {
          type: "text",
          text: replyText,
        },
        ...(replyAudio
          ? [
              {
                type: "audio" as "audio",
                originalContentUrl: replyAudio.url,
                duration: replyAudio.duration,
              },
            ]
          : []),
      ]);
    }
  }

  // 一定要回 200，否則 LINE 會報錯
  return c.text("OK", 200);
});

export default app; // Vercel Hono 必須 export 預設 app
