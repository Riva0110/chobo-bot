import Layout from "./Layout";

const Home = ({ records }) => {
  console.log(records);
  return (
    <Layout>
      {records.map((record) => (
        <div key={record.word}>
          <h2>{record.word}</h2>
          <p>
            <strong>英文解釋:</strong> {record.meaning_en}
          </p>
          {record.audio && (
            <audio controls>
              <source src={record.audio.url} type="audio/mpeg" />
            </audio>
          )}
        </div>
      ))}
    </Layout>
  );
};
export default Home;
