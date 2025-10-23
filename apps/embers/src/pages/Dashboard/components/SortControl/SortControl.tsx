import { Text } from "@/lib/components/Text";
import ChevronIcon from "@/public/icons/chevrondown-icon.svg?react";
import SortIcon from "@/public/icons/sort-icon.svg?react";

import styles from "./SortControl.module.scss";

interface SortControlProps {
  onSortChange: (sortBy: "date" | "name") => void;
  sortBy: "date" | "name";
}

export function SortControl({ onSortChange, sortBy }: SortControlProps) {
  return (
    <div className={styles["sort-control"]}>
      <SortIcon className={styles["sort-icon"]} />
      <Text color="primary" type="normal">
        Sort by
      </Text>
      <div className={styles["sort-dropdown"]}>
        <select
          className={styles.dropdown}
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as "date" | "name")}
        >
          <option value="date">Date</option>
          <option value="name">Name</option>
        </select>
        <ChevronIcon className={styles.chevron} />
      </div>
    </div>
  );
}
