import { PromptModal } from "@/lib/components/Modal/PromptModal";
import { useModal } from "@/lib/providers/modal/useModal";

export type PromptOptions = {
  cancelLabel?: string;
  closeOnBlur?: boolean;
  closeOnEsc?: boolean;
  confirmLabel?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  maxWidth?: number | string;
  title?: string;
};

export function usePrompt() {
  const { open } = useModal();

  return async (opts: PromptOptions = {}): Promise<boolean> => {
    const {
      cancelLabel = "Cancel",
      closeOnBlur = false,
      closeOnEsc = true,
      confirmLabel = "Confirm",
      inputLabel = "",
      inputPlaceholder = "",
      maxWidth = 300,
      title = "",
    } = opts;

    return new Promise<boolean>((resolve) => {
      open(
        <PromptModal
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          inputLabel={inputLabel}
          inputPlaceholder={inputPlaceholder}
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
