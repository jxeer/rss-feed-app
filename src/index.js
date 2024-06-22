const cors = require("cors");
const express = require("express");
const RSSParser = require("rss-parser");

const feedURL = "https://netflixtechblog.com/feed";
const parser = new RSSParser();
let articles = [];

const parse = async (url) => {
  const feed = await parser.parseURL(url);

  feed.items.forEach((item) => {
    articles.push({ item });
  });
};

parse(feedURL);

const app = express();
app.use(cors());
const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send(articles);
});

app.listen(port, () => {
  console.log(`App listens at http://localhost:${port}`);
});

module.exports = app;
