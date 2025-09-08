import SearchIcon from "@/public/icons/search-light-line-icon.svg?react";

import styles from "./SearchControl.module.scss";

interface SearchControlProps {
  onSearchChange: (query: string) => void;
  placeholder: string;
  searchQuery: string;
}

export function SearchControl({ onSearchChange, placeholder, searchQuery }: SearchControlProps) {
  return (
    <div className={styles["search-control"]}>
      <div className={styles["search-input-container"]}>
        <SearchIcon className={styles["search-icon"]} />
        <input
          className={styles["search-input"]}
          placeholder={placeholder}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
