import type React from "react";

import { useCallback, useMemo, useRef, useState } from "react";

import { Spinner } from "@/lib/components/Spinner";
import { LoaderContext } from "@/lib/providers/loader/useLoader";

export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const inFlightRef = useRef(0);

  const show = useCallback(() => {
    inFlightRef.current += 1;
    if (inFlightRef.current === 1) {
      setIsLoading(true);
    }
  }, []);

  const hide = useCallback(() => {
    inFlightRef.current = Math.max(0, inFlightRef.current - 1);
    if (inFlightRef.current === 0) {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(() => ({ hide, show }), [show, hide]);

  return (
    <LoaderContext.Provider value={value}>
      {children}
      <Spinner isOpen={isLoading} />
    </LoaderContext.Provider>
  );
};
