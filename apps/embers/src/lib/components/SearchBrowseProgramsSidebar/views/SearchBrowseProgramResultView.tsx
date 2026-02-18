import type React from "react";

import classNames from "classnames";
import { useTranslation } from "react-i18next";

import type { TranslationKey } from "@/i18n";

import { Button } from "@/lib/components/Button";
import { Select } from "@/lib/components/Select";
import { Text } from "@/lib/components/Text";
import SortIcon from "@/public/icons/sort-icon.svg?react";

import type { SearchResultItem, SortBy } from "../types";

import styles from "../SearchBrowseProgramsSidebar.module.scss";

type Props = {
  onEditSearch?: () => void;
  onExport?: () => void;
  onSaveQuery?: () => void;

  onShowDetails?: (item: SearchResultItem) => void;
  onSortByChange?: (sortBy: SortBy) => void;
  onViewOnGithub?: (item: SearchResultItem) => void;

  results: SearchResultItem[];
  sortBy: SortBy;
};

const getMatchLabel = (
  type: SearchResultItem["matchType"],
  t: (key: TranslationKey) => string,
) => {
  if (type === "exact") {
    return t("oslf.searchBrowsePrograms.matchLabels.exact");
  }
  if (type === "compatible") {
    return t("oslf.searchBrowsePrograms.matchLabels.compatible");
  }
  return t("oslf.searchBrowsePrograms.matchLabels.lenient");
};

const getMatchClassName = (type: SearchResultItem["matchType"]) => {
  if (type === "exact") {
    return styles["match-exact"];
  }
  if (type === "compatible") {
    return styles["match-compatible"];
  }
  return styles["match-lenient"];
};

export const SearchBrowseProgramsResultsView: React.FC<Props> = ({
  onEditSearch,
  onExport,
  onSaveQuery,

  onShowDetails,
  onSortByChange,
  onViewOnGithub,

  results,
  sortBy,
}) => {
  const { t } = useTranslation();

  const sortOptions: Array<{ label: string; value: SortBy }> = [
    { label: t("oslf.searchBrowsePrograms.sortOptions.score"), value: "score" },
  ];

  return (
    <>
      <div className={styles["results-header"]}>
        <Text type="large">{t("oslf.searchBrowsePrograms.searchResults")}</Text>
        <Text color="secondary" type="small">
          {t("oslf.searchBrowsePrograms.matchesFound", {
            count: results.length,
          })}
        </Text>
      </div>

      <div className={styles["results-controls"]}>
        <div className={styles["sort-control"]}>
          <SortIcon className={styles["sort-icon"]} />
          <Text color="primary" type="normal">
            {t("sort.sortBy")}
          </Text>

          <div className={styles["sort-dropdown"]}>
            <Select
              className={styles["sort-select"]}
              options={sortOptions}
              placement="bottom"
              value={sortBy}
              variant="compact"
              onChange={(v) => onSortByChange?.(v)}
            />
          </div>
        </div>
      </div>

      <div className={styles["results-list"]}>
        {results.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles["card-title-row"]}>
              <Text bold type="normal">
                {item.title}
              </Text>
            </div>

            <div className={styles.meta}>
              <div className={styles["meta-row"]}>
                <Text color="secondary" type="small">
                  {t("oslf.searchBrowsePrograms.score")}
                </Text>
                <Text
                  bold
                  className={classNames(
                    styles["meta-value"],
                    getMatchClassName(item.matchType),
                  )}
                  type="small"
                >
                  {item.score} ({getMatchLabel(item.matchType, t)})
                </Text>
              </div>

              <div className={styles["meta-row"]}>
                <Text color="secondary" type="small">
                  {t("oslf.searchBrowsePrograms.coverage")}
                </Text>
                <Text className={styles["meta-value"]} type="small">
                  {item.coverage}
                </Text>
              </div>
            </div>

            <div className={styles["card-actions"]}>
              <button
                className={styles.link}
                type="button"
                onClick={() => onShowDetails?.(item)}
              >
                {t("oslf.searchBrowsePrograms.showDetails")}{" "}
                <i className="fa fa-chevron-right" />
              </button>

              <button
                className={styles.link}
                type="button"
                onClick={() => onViewOnGithub?.(item)}
              >
                {t("oslf.searchBrowsePrograms.viewOnGithub")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles["results-footer"]}>
        <Button
          icon={
            <i className={classNames("fa", "fa-pencil", styles["btn-icon"])} />
          }
          type="secondary"
          onClick={() => onEditSearch?.()}
        >
          {t("oslf.searchBrowsePrograms.editSearch")}
        </Button>

        <Button
          icon={
            <i
              className={classNames(
                "fa",
                "fa-share-square",
                styles["btn-icon"],
              )}
            />
          }
          type="secondary"
          onClick={() => onExport?.()}
        >
          {t("oslf.searchBrowsePrograms.export")}
        </Button>

        <Button type="primary" onClick={() => onSaveQuery?.()}>
          {t("oslf.searchBrowsePrograms.saveQuery")}
        </Button>
      </div>
    </>
  );
};
