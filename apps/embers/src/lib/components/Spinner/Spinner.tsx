import Modal from "react-modal";

import styles from "./Spinner.module.scss";

type SpinnerProps = {
  isOpen: boolean;
};

export function Spinner({ isOpen }: SpinnerProps) {
  return (
    <Modal
      className={styles.content}
      isOpen={isOpen}
      overlayClassName={styles.overlay}
      shouldCloseOnEsc={false}
      shouldCloseOnOverlayClick={false}
    >
      <div className={styles.spinner} />
    </Modal>
  );
}
