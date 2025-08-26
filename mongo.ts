import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGO_URI as string;
const client = new MongoClient(uri);

let db: Db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("chobo-english");
  }
  return db;
}
