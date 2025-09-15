import { Input } from "@/lib/components/Input";
import SearchIcon from "@/public/icons/search-light-line-icon.svg?react";

import styles from "./SearchControl.module.scss";

interface SearchControlProps {
  onSearchChange: (query: string) => void;
  placeholder: string;
  searchQuery: string;
}

export function SearchControl({
  onSearchChange,
  placeholder,
  searchQuery,
}: SearchControlProps) {
  return (
    <div className={styles["search-control"]}>
      <Input
        leftIcon={<SearchIcon className={styles["search-icon"]} />}
        placeholder={placeholder}
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
