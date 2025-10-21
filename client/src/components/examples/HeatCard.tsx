import HeatCard from "../HeatCard";

export default function HeatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <HeatCard
        heatNumber={1}
        station="A"
        round={1}
        status="pending"
        competitors={[
          { id: "1", name: "John Smith", code: "PK" },
          { id: "2", name: "Jane Doe", code: "TR" }
        ]}
        onClick={() => console.log("Heat 1 clicked")}
      />
      <HeatCard
        heatNumber={7}
        station="B"
        round={1}
        status="active"
        competitors={[
          { id: "13", name: "Mike Johnson", code: "BR", score: 12 },
          { id: "14", name: "Sarah Williams", code: "GN", score: 15 }
        ]}
        onClick={() => console.log("Heat 7 clicked")}
      />
      <HeatCard
        heatNumber={3}
        station="C"
        round={1}
        status="completed"
        competitors={[
          { id: "5", name: "Alex Brown", code: "PK", score: 19 },
          { id: "6", name: "Emily Davis", code: "TR", score: 14 }
        ]}
        winner="5"
        onClick={() => console.log("Heat 3 clicked")}
      />
    </div>
  );
}
