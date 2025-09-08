import "dotenv/config"; // 載入 .env 檔
import { put } from "@vercel/blob";
import { parseBuffer } from "music-metadata";

import { openAIclient } from "./lib/openAI.js";

export const replyFormat = (data) =>
  `「${data.word}」

${data.meaning_zh}

${data.meaning_en}

🚩例句：

1. ${data.examples[0]}

2. ${data.examples[1]}`;

export const promptInput = (word) => `
你是一位英文老師，請極度嚴格依照以下 JSON 格式輸出：
{
  "word": string,       // 單字或片語等英文詞句
  "meaning_zh": string, // 繁體中文解釋
  "meaning_en": string, // 英文解釋
  "examples": string[]  // 例句，請給兩個例句
}

查詢的單字或片語等英文詞句：${word}

請只輸出 JSON，不要額外文字及其他排版。
如查詢不到單字或片語等英文詞句，請輸出 null
`;

export async function generateDefinition(word) {
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

export async function generateAudio(word) {
  try {
    const ttsResponse = await openAIclient.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: word,
    });

    const buffer = Buffer.from(await ttsResponse.arrayBuffer());

    const { url } = await put(
      `tts/${word.replace(/[^a-zA-Z]/g, "")}.mp3`,
      buffer,
      {
        access: "public", // 設定成公開可讀
        contentType: "audio/mpeg", // 告訴瀏覽器是 MP3
        token: process.env.BLOB_READ_WRITE_TOKEN, // 指定 token
      }
    );

    const metadata = await parseBuffer(buffer, "audio/mpeg");
    const durationSec = metadata.format.duration || 1;
    const durationMs = Math.floor(durationSec * 1000);

    return { url, duration: Math.max(1000, durationMs) };
  } catch (error) {
    return { error };
  }
}
