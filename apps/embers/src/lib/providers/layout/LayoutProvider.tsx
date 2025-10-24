import type React from "react";

import { useState } from "react";

import { LayoutContext } from "./useLayout";

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [headerTitle, setHeaderTitle] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <LayoutContext.Provider
      value={{
        headerTitle,
        isSidebarCollapsed,
        setHeaderTitle,
        setIsSidebarCollapsed,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
