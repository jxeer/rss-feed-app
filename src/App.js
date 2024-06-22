import axios from "axios";
import { useEffect, useState } from "react";
import Feed from "./src/Feed";

function App() {
  const [articles, setArticles] = useState([]);

  const getArticles = async () => {
    try {
      const res = await axios.get("/api/articles"); // Use relative URL
      setArticles(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getArticles();
  }, []);

  return (
    <>
      <h1 className="text-xl font-semibold text-center mt-5">RSS Feed</h1>

      <h2 className="text-3xl font-semibold text-center mt-2 mb-4">
        Good morning, Julian
      </h2>
      <div className="w-3/4 max-w-lg border mx-auto p-5 rounded-xl">
        <div className="bg-black flex flex-col items-center rounded-lg py-2 px-6 mb-5">
          <img
            src="https://cdn-images-1.medium.com/max/606/1*rOPLUJ3W6FUA3rO1U1IeuA@2x.png"
            alt="netflix technology blog rss feed"
          />
        </div>
        {articles.map((item, i) => (
          <Feed
            key={i}
            title={item.title}
            link={item.link}
            date={item.pubDate}
          />
        ))}
      </div>
    </>
  );
}

export default App;
