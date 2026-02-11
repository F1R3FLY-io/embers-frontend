import type { ReactNode } from "react";

import { FormModal } from "@/lib/components/Modal/FormModal";
import { useModal } from "@/lib/providers/modal/useModal";

export type FromModalOptions<T> = {
  closeOnBlur?: boolean;
  closeOnEsc?: boolean;
  component: (onSubmit: (value: T) => void, onCancel: () => void) => ReactNode;
  maxWidth?: number | string;
  title?: string;
};

export function useFormModal<T>() {
  const { open } = useModal();

  return async ({
    closeOnBlur = false,
    closeOnEsc = true,
    component,
    maxWidth = "40vw",
    title = "",
  }: FromModalOptions<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      open(
        <FormModal
          component={component}
          onCancel={reject}
          onSubmit={resolve}
        />,
        {
          ariaLabel: title,
          closeOnBlur,
          closeOnEsc,
          maxWidth,
          showCloseButton: false,
        },
      );
    });
  };
}
