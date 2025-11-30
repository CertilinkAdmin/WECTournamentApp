import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import FullStationPage from "@/pages/FullStationPage";
import { Card, CardContent } from "@/components/ui/card";
import type { Station } from "@shared/schema";

export default function StationDetail() {
  const { stationId } = useParams<{ stationId: string }>();
  const numericId = stationId ? Number(stationId) : null;

  const { data: stations = [], isLoading } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
    enabled: numericId !== null,
  });

  if (isLoading || numericId === null) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Card>
          <CardContent className="p-6 text-muted-foreground">
            Loading station...
          </CardContent>
        </Card>
      </div>
    );
  }

  const station = stations.find((s) => s.id === numericId);

  if (!station) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Station not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return <FullStationPage />;
}

