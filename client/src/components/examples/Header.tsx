import { useState } from "react";
import Header from "../Header";

export default function HeaderExample() {
  const [role, setRole] = useState<"admin" | "judge" | "barista">("admin");

  return (
    <Header 
      currentRole={role} 
      onRoleChange={setRole}
      tournamentName="World Espresso Championships"
      currentRound={1}
    />
  );
}
