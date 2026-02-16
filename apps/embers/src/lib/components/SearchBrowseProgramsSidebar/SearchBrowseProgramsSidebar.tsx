import type React from "react";

import classNames from "classnames";
import { useTranslation } from "react-i18next";

import { SearchBrowseProgramsFiltersView } from "@/lib/components/SearchBrowseProgramsSidebar/views/SearchBrowseProgramFilterView";
import { SearchBrowseProgramsResultsView } from "@/lib/components/SearchBrowseProgramsSidebar/views/SearchBrowseProgramResultView";
import { Text } from "@/lib/components/Text";

import type {
  SearchBrowseProgramsFilters,
  SearchResultItem,
  SearchState,
  SortBy,
} from "./types";

import styles from "./SearchBrowseProgramsSidebar.module.scss";

type Props = {
  className?: string;

  initialFilters?: Partial<SearchBrowseProgramsFilters>;

  onEditSearch?: () => void;
  onExport?: () => void;

  onSaveQuery?: () => void;
  onSearch?: (filters: SearchBrowseProgramsFilters) => void;
  onShowDetails?: (item: SearchResultItem) => void;

  onSortByChange?: (sortBy: SortBy) => void;
  onViewOnGithub?: (item: SearchResultItem) => void;
  results?: SearchResultItem[];

  searchState: SearchState;
  sortBy?: SortBy;
};

export const SearchBrowseProgramsSidebar: React.FC<Props> = ({
  className,
  initialFilters,

  onEditSearch,
  onExport,

  onSaveQuery,
  onSearch,
  onShowDetails,

  onSortByChange,
  onViewOnGithub,
  results = [],

  searchState,
  sortBy = "score",
}) => {
  const { t } = useTranslation();

  return (
    <div className={classNames(styles.container, className)}>
      <Text className={styles.header} type="large">
        {t("oslf.searchBrowsePrograms.title")}
      </Text>

      <div className={styles.content}>
        {searchState === "results" ? (
          <SearchBrowseProgramsResultsView
            results={results}
            sortBy={sortBy}
            onEditSearch={onEditSearch}
            onExport={onExport}
            onSaveQuery={onSaveQuery}
            onShowDetails={onShowDetails}
            onSortByChange={onSortByChange}
            onViewOnGithub={onViewOnGithub}
          />
        ) : (
          <SearchBrowseProgramsFiltersView
            initialFilters={initialFilters}
            isSearching={searchState === "searching"}
            onSearch={onSearch}
          />
        )}
      </div>
    </div>
  );
};
