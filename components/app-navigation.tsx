import type { AppTab } from "@/lib/types";

export function AppNavigation({ tab, onChange }: { tab: AppTab; onChange: (tab: AppTab) => void }) {
  return <nav className="tabs" aria-label="Huvudmeny">
    <button className={tab === "routines" ? "active" : ""} onClick={() => onChange("routines")}>Rutiner</button>
    <button className={tab === "today" ? "active" : ""} onClick={() => onChange("today")}>Aktuella tasks</button>
    <button className={tab === "library" ? "active" : ""} onClick={() => onChange("library")}>Bibliotek</button>
  </nav>;
}
