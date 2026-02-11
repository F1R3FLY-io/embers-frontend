import classNames from "classnames";
import { useEffect, useState } from "react";

import AgentIcon from "@/public/icons/aiagent-light-line-icon.svg?react";

import styles from "./IconPreview.module.scss";

export interface IconPreviewProps {
  className?: string;
  size?: number;
  url?: string | null;
}

export function IconPreview({ className, size = 72, url }: IconPreviewProps) {
  const [loadError, setLoadError] = useState(false);
  const hasValidImage = url && !loadError;
  useEffect(() => setLoadError(false), [url]);

  return (
    <div
      className={classNames(styles["icon-preview"], className)}
      style={{ height: size, width: size }}
    >
      {hasValidImage ? (
        <img
          alt=""
          className={styles["icon-image"]}
          src={url}
          onError={() => setLoadError(true)}
          onLoad={() => setLoadError(false)}
        />
      ) : (
        <AgentIcon className={styles["icon-placeholder"]} />
      )}
    </div>
  );
}
