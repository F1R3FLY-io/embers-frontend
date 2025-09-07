import type React from "react";

import { useState } from "react";

import { LayoutContext } from "./useLayout";

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [headerTitle, setHeaderTitle] = useState("");

  return (
    <LayoutContext.Provider value={{ headerTitle, setHeaderTitle }}>
      {children}
    </LayoutContext.Provider>
  );
};
