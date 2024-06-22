const Feed = ({ title, link, date }) => {
  let formatted = { day: "numberic", month: "long", year: "numeric" };
  let articleDate = new Date(date).toLocaleDateSTring("en-US", formatted);

  return (
    <div>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="hover: opacity-70 hover:text-orange-500"
      >
        <h3 className="text-xl mb-1 underline">{title}</h3>
        <p>{articleDate}</p>
      </a>
    </div>
  );
};

export default Feed;
