import { ConfirmModal } from "@/lib/components/Modal/ConfirmModal";
import { useModal } from "@/lib/providers/modal/useModal";

export type ConfirmOptions = {
  cancelLabel?: string;
  closeOnBlur?: boolean;
  closeOnEsc?: boolean;
  confirmLabel?: string;
  maxWidth?: number | string;
  message?: string;
  title?: string;
};

export function useConfirm() {
  const { open } = useModal();

  return async (opts: ConfirmOptions = {}): Promise<boolean> => {
    const {
      cancelLabel = "Cancel",
      closeOnBlur = false,
      closeOnEsc = true,
      confirmLabel = "Confirm",
      maxWidth = 300,
      message = "",
      title = "",
    } = opts;

    return new Promise<boolean>((resolve) => {
      open(
        <ConfirmModal
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          message={message}
          title={title}
          onCancel={() => resolve(false)}
          onConfirm={() => resolve(true)}
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
