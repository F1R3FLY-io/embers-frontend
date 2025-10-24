import type React from "react";

import { useCallback, useState } from "react";

import { Spinner } from "@/lib/components/Spinner";
import { LoaderContext } from "@/lib/providers/loader/useLoader";

export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = useCallback(() => setIsLoading(true), []);
  const hideLoader = useCallback(() => setIsLoading(false), []);

  return (
    <LoaderContext.Provider value={{ hideLoader, showLoader }}>
      {children}
      <Spinner isOpen={isLoading} />
    </LoaderContext.Provider>
  );
};
