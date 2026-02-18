export type SearchScope = "public_github" | "private_github";
export type MatchMode = "exact" | "compatible" | "lenient";
export type CoverageTarget =
  | "whole_program"
  | "validate_only"
  | "transform_only";

export type SearchBrowseProgramsFilters = {
  coverageTarget: CoverageTarget;
  matchMode: MatchMode;
  repository: string;
  runtimes: string[];
  scope: SearchScope;
};

export type SearchState = "idle" | "searching" | "results";

export type SearchResultMatchType = "exact" | "compatible" | "lenient";

export type SearchResultItem = {
  coverage: string;
  id: string;
  matchType: SearchResultMatchType;
  score: number;
  title: string;
};

export type SortBy = "score";
