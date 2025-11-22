import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  currentRole: "admin" | "judge" | "competitor" | "station_lead";
  onRoleChange?: (role: "admin" | "judge" | "competitor" | "station_lead") => void;
  tournamentName?: string;
  currentRound?: number;
}

export default function Header({ 
  currentRole, 
  onRoleChange,
  tournamentName = "World Espresso Championships",
  currentRound = 1
}: HeaderProps) {
  const roleColors = {
    admin: "bg-primary text-primary-foreground",
    judge: "bg-chart-3 text-white",
    competitor: "bg-secondary text-secondary-foreground",
    station_lead: "bg-chart-1 text-white"
  };

  const roleLabels = {
    admin: "Admin",
    judge: "Judge",
    competitor: "Competitor",
    station_lead: "Station Lead"
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <Trophy className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-heading font-bold leading-none">
              {tournamentName}
            </h1>
            <p className="text-sm text-primary-foreground/80 mt-1">
              ABC Tournament System - Round {currentRound}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 hover:bg-primary-foreground/20 active:bg-primary-foreground/30 rounded-lg transition-all hover:border border-transparent hover:border-primary-foreground/30">
            <ThemeToggle />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                data-testid="button-role-switcher"
              >
                <Badge className={roleColors[currentRole]} data-testid={`badge-role-${currentRole}`}>
                  {roleLabels[currentRole]}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onRoleChange?.("admin")}
                data-testid="menu-role-admin"
              >
                Admin View
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onRoleChange?.("station_lead")}
                data-testid="menu-role-station-lead"
              >
                Station Lead View
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onRoleChange?.("judge")}
                data-testid="menu-role-judge"
              >
                Judge View
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onRoleChange?.("competitor")}
                data-testid="menu-role-competitor"
              >
                Competitor View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
