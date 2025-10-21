import StationDashboard from "../StationDashboard";

export default function StationDashboardExample() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <StationDashboard
        station="B"
        currentHeat={{
          heatNumber: 7,
          competitors: ["Mike Johnson", "Sarah Williams"],
          scheduledTime: "2:00 PM"
        }}
        upcomingHeats={[
          {
            heatNumber: 8,
            competitors: ["Alex Brown", "Emily Davis"],
            scheduledTime: "2:20 PM"
          },
          {
            heatNumber: 9,
            competitors: ["Chris Lee", "Pat Taylor"],
            scheduledTime: "2:40 PM"
          }
        ]}
      />
    </div>
  );
}
