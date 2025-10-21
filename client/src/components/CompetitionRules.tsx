import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function CompetitionRules() {
  const rules = [
    "Espresso prepared using freestyle flow (lever) on Dalla Corte Zero (3/5/7/9 g/s options).",
    "Only the competition compulsory coffee may be used.",
    "Use the official competition grinder.",
    "Ingredients limited to ground coffee and water (paper/metal filters in basket allowed).",
    "Mineralised water products may be added post-brew to finished espressos.",
    "Choice of 54mm or 58mm portafilter before DIAL IN (swap anytime during DIAL IN).",
    "Portafilter baskets may be changed during DIAL IN to accommodate dose (min 16 g, max 22 g).",
    "Group head water temperature may be changed (85°C – 100°C). Pump pressure fixed at 8.5–9 bar.",
    "Single Espresso defined as 15–30 g / 25–35 ml. Cappuccino: single Espresso + 150–200 ml steamed milk with microfoam.",
    "Coffees not presented within BREW TIMES will not be evaluated.",
    "Failure to comply may result in disqualification."
  ];

  return (
    <Card data-testid="card-rules">
      <CardHeader className="bg-primary/10">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Info className="h-5 w-5" />
          The Rules
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ul className="space-y-3">
          {rules.map((rule, index) => (
            <li key={index} className="flex gap-3 text-sm">
              <span className="text-primary font-medium flex-shrink-0">•</span>
              <span className="text-foreground">{rule}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
