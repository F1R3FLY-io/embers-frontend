import type React from "react";

import { useMemo, useState } from "react";

import type { AccordionProps } from "@/lib/components/Accordion/Accordion";

import { Accordion } from "@/lib/components/Accordion";
import { Text } from "@/lib/components/Text";
import { SearchControl } from "@/pages/Dashboard/components/SearchControl";

import styles from "./OSLF.module.scss";

export type OSLFBlockPaletteItem = {
  iconSrc?: string;
  label: string;
  tooltip?: string;
  type: string;
};

export type OSLFBlockCategory = {
  id: string;
  items: OSLFBlockPaletteItem[];
  label: string;
};

export type OSLFSidebarProps = {
  categories: OSLFBlockCategory[];

  searchPlaceholder?: string;
  title?: string;
};

const BlockAccordion = (props: AccordionProps) => {
  const closeIcon = <i className="fa fa-chevron-right" />;
  const openIcon = <i className="fa fa-chevron-down" />;
  return (
    <Accordion
      {...props}
      closedIcon={closeIcon}
      iconPosition="end"
      openedIcon={openIcon}
      overflow="hidden"
    />
  );
};

const BlockItem: React.FC<{
  item: OSLFBlockPaletteItem;
}> = ({ item }) => {
  return (
    <div
      draggable
      className={styles["block-item"]}
      title={item.tooltip}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-oslf-block", item.type);
        e.dataTransfer.effectAllowed = "copy";
      }}
    >
      {item.iconSrc ? (
        <img alt="" className={styles["block-icon"]} src={item.iconSrc} />
      ) : (
        <div className={styles["block-icon-placeholder"]} />
      )}

      <div className={styles["block-label"]}>{item.label}</div>
    </div>
  );
};

export const Sidebar: React.FC<OSLFSidebarProps> = ({
  categories,
  searchPlaceholder = "Type to search",
  title = "Categories",
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return categories;
    }

    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((it) => {
          const label = it.label.toLowerCase();
          const tooltip = (it.tooltip ?? "").toLowerCase();
          const type = it.type.toLowerCase();
          return label.includes(q) || tooltip.includes(q) || type.includes(q);
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchQuery]);

  return (
    <div className={styles.sidebar}>
      <div className={styles.body}>
        <div className={styles.sidebarControls}>
          <div className={styles.sidebarHeaderRow}>
            <Text color="primary" type="small">
              {title}
            </Text>

            <div className={styles.searchIcon}>
              <i className="fa fa-search" />
            </div>
          </div>

          <SearchControl
            placeholder={searchPlaceholder}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {filteredCategories.map((cat) => (
          <BlockAccordion key={cat.id} title={cat.label}>
            {cat.items.map((item) => (
              <BlockItem key={item.type} item={item} />
            ))}
          </BlockAccordion>
        ))}
      </div>
    </div>
  );
};
