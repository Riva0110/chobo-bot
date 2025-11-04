import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

type FlashcardRecord = {
  word: string;
  meaning_en: string;
  meaning_zh: string;
  audio: {
    url: string;
  } | null;
  examples: string[] | null;
};

function Flashcard({ record }: { record: FlashcardRecord }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = (e: React.MouseEvent<HTMLButtonElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    e.stopPropagation();

    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const renderAudioButton = () => (
    <div className="flex items-center">
      <audio
        ref={audioRef}
        src={record.audio?.url}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        onClick={togglePlay}
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </button>
    </div>
  );

  return (
    <div
      className="border-2 border-purple-500 rounded-md p-4"
      onClick={() => setFlipped(!flipped)}
    >
      {!flipped ? (
        <div className="flex justify-between">
          <h2 className="text-3xl">{record.word}</h2>
          {record.audio && renderAudioButton()}
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-6">{record.meaning_en}</p>
          <p className="text-gray-600 mb-6">{record.meaning_zh}</p>
          -----
          {record.examples && (
            <ul className="list-disc list-inside">
              <li className="mb-2">{record.examples[0]}</li>
              <li className="mb-2">{record.examples[1]}</li>
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default Flashcard;
