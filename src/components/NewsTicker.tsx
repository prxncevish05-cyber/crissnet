const NewsTicker = () => {
  const headlines = [
    "Multi-vehicle pile-up on NH-48 near Khopoli",
    "Heavy rain warning for Pune–Mumbai corridor",
    "Emergency lane cleared near Borghat section",
    "Speed limit 60 km/h active near accident zone",
  ];

  return (
    <div className="overflow-hidden py-[7px] relative min-h-[30px]" style={{ background: "hsl(var(--cn-red))" }}>
      <div className="absolute left-0 top-0 bottom-0 px-3.5 flex items-center font-bold text-xs z-[2] whitespace-nowrap" style={{ background: "hsl(var(--cn-red-dark))", color: "#fff" }}>
        🚨 LIVE
      </div>
      <div className="flex items-center whitespace-nowrap cn-animate-ticker pl-[160px]" style={{ color: "#fff" }}>
        {headlines.map((h, i) => (
          <span key={i} className="mr-[50px] text-xs font-medium">⚠️ {h}</span>
        ))}
      </div>
    </div>
  );
};

export default NewsTicker;
