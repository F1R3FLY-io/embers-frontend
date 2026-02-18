import type React from "react";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Option } from "@/lib/components/Select";

import { Button } from "@/lib/components/Button";
import { Input } from "@/lib/components/Input";
import { Select } from "@/lib/components/Select";
import { Tag } from "@/lib/components/Tag";
import { Text } from "@/lib/components/Text";

import type {
  CoverageTarget,
  MatchMode,
  SearchBrowseProgramsFilters,
  SearchScope,
} from "../types";

import styles from "../SearchBrowseProgramsSidebar.module.scss";

type Props = {
  initialFilters?: Partial<SearchBrowseProgramsFilters>;
  isSearching?: boolean;
  onSearch?: (filters: SearchBrowseProgramsFilters) => void;
};

const runtimeOptions = ["Rholang", "API", "EVM", "WASM"];

export const SearchBrowseProgramsFiltersView: React.FC<Props> = ({
  initialFilters,
  isSearching = false,
  onSearch,
}) => {
  const { t } = useTranslation();

  const defaults = useMemo<SearchBrowseProgramsFilters>(
    () => ({
      coverageTarget: initialFilters?.coverageTarget ?? "whole_program",
      matchMode: initialFilters?.matchMode ?? "exact",
      repository: initialFilters?.repository ?? "",
      runtimes: initialFilters?.runtimes ?? ["Rholang", "API"],
      scope: initialFilters?.scope ?? "public_github",
    }),
    [initialFilters],
  );

  const scopeOptions = useMemo<Option<SearchScope>[]>(
    () => [
      {
        label: t("oslf.searchBrowsePrograms.scopeOptions.publicGithub"),
        value: "public_github",
      },
      {
        label: t("oslf.searchBrowsePrograms.scopeOptions.privateGithub"),
        value: "private_github",
      },
    ],
    [t],
  );

  const matchModeOptions = useMemo<Option<MatchMode>[]>(
    () => [
      {
        label: t("oslf.searchBrowsePrograms.matchModeOptions.exact"),
        value: "exact",
      },
      {
        label: t("oslf.searchBrowsePrograms.matchModeOptions.compatible"),
        value: "compatible",
      },
      {
        label: t("oslf.searchBrowsePrograms.matchModeOptions.lenient"),
        value: "lenient",
      },
    ],
    [t],
  );

  const coverageTargetOptions = useMemo<Option<CoverageTarget>[]>(
    () => [
      {
        label: t(
          "oslf.searchBrowsePrograms.coverageTargetOptions.wholeProgram",
        ),
        value: "whole_program",
      },
      {
        label: t(
          "oslf.searchBrowsePrograms.coverageTargetOptions.validateOnly",
        ),
        value: "validate_only",
      },
      {
        label: t(
          "oslf.searchBrowsePrograms.coverageTargetOptions.transformOnly",
        ),
        value: "transform_only",
      },
    ],
    [t],
  );

  const [filters, setFilters] = useState<SearchBrowseProgramsFilters>(defaults);

  const addRuntime = (runtime: string) => {
    setFilters((prev) => {
      if (prev.runtimes.includes(runtime)) {
        return prev;
      }
      return { ...prev, runtimes: [...prev.runtimes, runtime] };
    });
  };

  const removeRuntime = (runtime: string) => {
    setFilters((prev) => ({
      ...prev,
      runtimes: prev.runtimes.filter((r) => r !== runtime),
    }));
  };

  return (
    <div className={styles.section}>
      <Text type="large">
        {t("oslf.searchBrowsePrograms.scopeAndAlgorithm")}
      </Text>

      <div className={styles.fields}>
        <div className={styles["disabled-wrap"]} data-disabled={isSearching}>
          <Select
            label={t("oslf.searchBrowsePrograms.scope")}
            options={scopeOptions}
            value={filters.scope}
            onChange={(scope) => setFilters((p) => ({ ...p, scope }))}
          />

          <div className={styles["input-field"]}>
            <Text
              bold
              className={styles["input-label"]}
              color="secondary"
              type="small"
            >
              {t("oslf.searchBrowsePrograms.repository")}
            </Text>
            <Input
              placeholder={t("oslf.searchBrowsePrograms.repositoryPlaceholder")}
              value={filters.repository}
              onChange={(e) =>
                setFilters((p) => ({ ...p, repository: e.target.value }))
              }
            />
          </div>

          <Select
            label={t("oslf.searchBrowsePrograms.matchMode")}
            options={matchModeOptions}
            value={filters.matchMode}
            onChange={(matchMode) => setFilters((p) => ({ ...p, matchMode }))}
          />

          <div className={styles["tag-field"]}>
            <Text bold color="secondary" type="small">
              {t("oslf.searchBrowsePrograms.runtimes")}
            </Text>

            <div className={styles["tag-row"]}>
              {filters.runtimes.length > 0 ? (
                filters.runtimes.map((runtime) => (
                  <Tag
                    key={runtime}
                    selected
                    variant="solid"
                    onClose={() => removeRuntime(runtime)}
                  >
                    {runtime}
                  </Tag>
                ))
              ) : (
                <Text color="secondary" type="small">
                  {t("oslf.searchBrowsePrograms.noRuntimes")}
                </Text>
              )}
            </div>

            <div className={styles["tag-row"]}>
              {runtimeOptions
                .filter((r) => !filters.runtimes.includes(r))
                .map((runtime) => (
                  <Tag
                    key={runtime}
                    variant="soft"
                    onClick={() => addRuntime(runtime)}
                  >
                    {runtime}
                  </Tag>
                ))}
            </div>
          </div>

          <Select
            label={t("oslf.searchBrowsePrograms.coverageTarget")}
            options={coverageTargetOptions}
            value={filters.coverageTarget}
            onChange={(coverageTarget) =>
              setFilters((p) => ({ ...p, coverageTarget }))
            }
          />
        </div>
      </div>

      {isSearching && (
        <div className={styles["loading-row"]}>
          <i className="fa fa-spinner fa-spin" />
          <Text color="secondary" type="small">
            {t("oslf.searchBrowsePrograms.searching")}
          </Text>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          className={styles.button}
          disabled={isSearching}
          type="primary"
          onClick={() => onSearch?.(filters)}
        >
          {t("oslf.searchBrowsePrograms.startSearch")}
        </Button>
      </div>
    </div>
  );
};
