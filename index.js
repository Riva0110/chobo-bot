const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("@line/bot-sdk");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// 從 LINE Developers 拿到的
const config = {
  channelAccessToken: process.env.TOKEN,
  channelSecret: process.env.SECRET,
};
const client = new Client(config);

// Webhook 接收訊息
app.post("/", async (req, res) => {
  const events = req.body.events;
  for (let event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const word = event.message.text.trim();
      const meaning = await lookupWord(word);
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: `${meaning}
        
https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/${word}
        `,
      });
    }
  }

  // 一定要回 200，否則 LINE 會報錯
  res.status(200).send("OK");
});

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

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
