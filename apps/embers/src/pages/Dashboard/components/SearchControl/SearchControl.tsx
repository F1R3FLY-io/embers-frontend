import classNames from "classnames";

import { Input } from "@/lib/components/Input";
import SearchIcon from "@/public/icons/search-light-line-icon.svg?react";

import styles from "./SearchControl.module.scss";

interface SearchControlProps {
  className?: string;
  onSearchChange: (query: string) => void;
  placeholder: string;
  searchQuery: string;
}

export function SearchControl({
  className,
  onSearchChange,
  placeholder,
  searchQuery,
}: SearchControlProps) {
  return (
    <div className={classNames(styles["search-control"], className)}>
      <Input
        inputType="input"
        leftIcon={<SearchIcon className={styles["search-icon"]} />}
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
