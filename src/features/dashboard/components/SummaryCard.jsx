
const SummaryCard = ({ title, value }) => {
  return (
    <div className="bg-white shadow-md p-4 rounded">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default SummaryCard;
