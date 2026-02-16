import type React from "react";

import { useState } from "react";

import type {
  SearchBrowseProgramsFilters,
  SearchResultItem,
  SearchState,
  SortBy,
} from "@/lib/components/SearchBrowseProgramsSidebar";

import { SearchBrowseProgramsSidebar } from "@/lib/components/SearchBrowseProgramsSidebar";
import { Layout } from "@/lib/layouts";
import { Footer, Header } from "@/lib/layouts/OSLF";

interface OSLFLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const OSLFLayout: React.FC<OSLFLayoutProps> = ({ children, title }) => {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [sortBy, setSortBy] = useState<SortBy>("score");
  const [results, setResults] = useState<SearchResultItem[]>([]);

  const handleSearch = async (_filters: SearchBrowseProgramsFilters) => {
    setIsRightSidebarOpen(true);
    setSearchState("searching");

    const mockedResults: SearchResultItem[] = [
      {
        coverage:
          "Validate Schema (JSON, strict) → Match Case(status) → Transform Data (JSON→Avro)",
        id: "1",
        matchType: "exact",
        score: 94,
        title: "Order Validator v2 (GitHub — Private Repo)",
      },
      {
        coverage: "Validate Schema only",
        id: "2",
        matchType: "compatible",
        score: 87,
        title: "Schema Guard (Public GitHub)",
      },
      {
        coverage: "Transform Data (partial)",
        id: "3",
        matchType: "lenient",
        score: 80,
        title: "Data Transformer Pro (GitHub — Org Repo)",
      },
    ];

    await new Promise((r) => {
      setTimeout(r, 600);
    });

    setResults(mockedResults);
    setSearchState("results");
  };

  const handleEditSearch = () => {
    setSearchState("idle");
  };

  return (
    <Layout
      footer={<Footer />}
      headerActions={
        <Header
          isRightSidebarOpen={isRightSidebarOpen}
          onRightSidebarOpenChange={(open) => {
            setIsRightSidebarOpen(open);
            if (!open) {
              setSearchState("idle");
            }
          }}
        />
      }
      isRightSidebarOpen={isRightSidebarOpen}
      rightSidebar={
        <SearchBrowseProgramsSidebar
          initialFilters={{
            coverageTarget: "whole_program",
            matchMode: "exact",
            repository: "",
            runtimes: ["Rholang", "API"],
            scope: "public_github",
          }}
          results={results}
          searchState={searchState}
          sortBy={sortBy}
          onEditSearch={handleEditSearch}
          onExport={() => {}}
          onSaveQuery={() => {}}
          onSearch={(filters) => {
            void handleSearch(filters);
          }}
          onShowDetails={() => {}}
          onSortByChange={setSortBy}
          onViewOnGithub={() => {}}
        />
      }
      title={title}
      onBackClick={() => {}}
      onRightSidebarOpenChange={(open) => {
        setIsRightSidebarOpen(open);
        if (!open) {
          setSearchState("idle");
        }
      }}
      onSettingsClick={() => {}}
    >
      {children}
    </Layout>
  );
};
