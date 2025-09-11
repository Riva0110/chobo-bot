import "dotenv/config"; // 載入 .env 檔
import { Client } from "@line/bot-sdk";

// 從 LINE Developers 拿到的
const config = {
  channelAccessToken: process.env.TOKEN,
  channelSecret: process.env.SECRET,
};
export const lineClient = new Client(config);
