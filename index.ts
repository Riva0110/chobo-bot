import app from "./src/app";
import { handle } from "hono/vercel";

export default handle(app); // ⚡️ 這樣會自動處理所有方法（推薦）
