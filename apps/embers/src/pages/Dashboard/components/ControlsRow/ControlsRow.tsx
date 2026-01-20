import type {TabId} from "@/pages/Dashboard/Dashboard";

import { SearchControl } from "@/pages/Dashboard/components/SearchControl";
import { SortControl } from "@/pages/Dashboard/components/SortControl";

import styles from "./ControlsRow.module.scss";

interface ControlsRowProps {
  onSearchChange: (query: string) => void;
  onSortChange: (sortBy: "date" | "name") => void;
  searchQuery: string;
  selectedTab: TabId;
  sortBy: "date" | "name";
}

export function ControlsRow({
  onSearchChange,
  onSortChange,
  searchQuery,
  selectedTab,
  sortBy,
}: ControlsRowProps) {
  const placeholder = `Type to search ${selectedTab === "agents" ? "agents" : "agent teams"}...`;

  return (
    <div className={styles["controls-row"]}>
      <SortControl sortBy={sortBy} onSortChange={onSortChange} />
      <SearchControl
        className={styles["search-control"]}
        placeholder={placeholder}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
    </div>
  );
}
