import JudgeScorecard from "../JudgeScorecard";

export default function JudgeScorecardExample() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <JudgeScorecard
        heatNumber={7}
        competitors={[
          { name: "COMPETITOR A", code: "PK" },
          { name: "COMPETITOR B", code: "TR" }
        ]}
        onSubmit={(scores) => console.log("Submitted scores:", scores)}
      />
    </div>
  );
}
