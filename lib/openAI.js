import "dotenv/config"; // 載入 .env 檔
import OpenAI from "openai";

export const openAIclient = new OpenAI();
