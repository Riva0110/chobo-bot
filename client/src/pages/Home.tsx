import { useEffect, useState } from "react";

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
    async function fetchRecords() {
      try {
        const res = await fetch("/api/records");
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecords();
  }, []);

  return (
    <>
      {loading && <p>Loading...</p>}
      {records.map((record) => (
        <div key={record.word}>
          <h2>{record.word}</h2>
          <p>
            <strong>英文解釋!:</strong> {record.meaning_en}
          </p>
          {record.audio && (
            <audio controls>
              <source src={record.audio.url} type="audio/mpeg" />
            </audio>
          )}
        </div>
      ))}
    </>
  );
};

export default Home;
