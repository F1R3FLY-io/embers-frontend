import { useEffect, useRef } from "react";

type UseCallOnceProps<T> = {
  action: (data: T) => void;
  data: T;
  pred: (data: T) => boolean;
};

export function useCallOnce<T>({ action, data, pred }: UseCallOnceProps<T>) {
  const updated = useRef(false);

  useEffect(() => {
    if (updated.current) {
      return;
    }
    if (pred(data)) {
      updated.current = true;
      action(data);
    }
  });
}
