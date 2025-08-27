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
