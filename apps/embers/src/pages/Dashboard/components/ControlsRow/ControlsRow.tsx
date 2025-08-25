import { SearchControl } from "../SearchControl";
import { SortControl } from "../SortControl";
import styles from "./ControlsRow.module.scss";

interface ControlsRowProps {
  onSearchChange: (query: string) => void;
  onSortChange: (sortBy: "date" | "name") => void;
  searchQuery: string;
  selectedTab: "agents" | "agent-teams";
  sortBy: "date" | "name";
}

export function ControlsRow({ 
  onSearchChange, 
  onSortChange, 
  searchQuery, 
  selectedTab, 
  sortBy 
}: ControlsRowProps) {
  const placeholder = `Type to search ${selectedTab === "agents" ? "agents" : "agent teams"}...`;

  return (
    <div className={styles["controls-row"]}>
      <SortControl sortBy={sortBy} onSortChange={onSortChange} />
      <SearchControl 
        placeholder={placeholder} 
        searchQuery={searchQuery} 
        onSearchChange={onSearchChange}
      />
    </div>
  );
}
