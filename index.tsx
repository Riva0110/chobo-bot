import { Hono } from "hono";
import { serve } from "@hono/node-server";

import { connectDB } from "./lib/db.js";
import { lineClient } from "./lib/lineClient.js";
import { replyFormat, generateDefinition, generateAudio } from "./utils.js";
import Home from "./pages/Home.js";

const app = new Hono();

app.get("/", async (c) => {
  const db = await connectDB();
  const userRecord = db.collection("userRecord");
  const records = await userRecord
    .aggregate([
      {
        $match: {
          groupId: "Ca8f4a9df1a7722b8ed4d51527ab6e4b2",
        },
      },
      {
        $lookup: {
          from: "vocabulary",
          localField: "word",
          foreignField: "word",
          as: "vocabInfo",
        },
      },
      { $unwind: "$vocabInfo" },
      {
        $project: {
          _id: 0,
          word: 1,
          history: 1,
          meaning_zh: "$vocabInfo.meaning_zh",
          meaning_en: "$vocabInfo.meaning_en",
          examples: "$vocabInfo.examples",
          audio: "$vocabInfo.audio",
        },
      },
    ])
    .toArray();

  return c.html(<Home records={records} />);
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
      let replyAudio = null;
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
          if (!audio?.error) {
            replyAudio = audio;
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

// serve(app);

export default app; // Vercel Hono 必須 export 預設 app
