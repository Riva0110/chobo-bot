import { useEffect, useState } from "react";
import Flashcard from "../components/Flashcard";

type RecordType = {
  word: string;
  history: Array<{ searchedAt: string }>;
  meaning_zh: string;
  meaning_en: string;
  examples: Array<string>;
  audio: { url: string; duration: number } | null;
};

const Home = () => {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function randomFetchVocabulary() {
      try {
        const res = await fetch("/api/review");
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    randomFetchVocabulary();
  }, []);

  return (
    <div className="p-4 ">
      <h1 className="text-3xl text-center m-8 font-bold">Chobo English</h1>
      {loading && <p className="text-center text-gray-500">Loading...</p>}
      <div className="flex flex-col gap-8">
        {records.map((record) => (
          <Flashcard key={record.word} record={record} />
        ))}
      </div>
    </div>
  );
};

export default Home;
