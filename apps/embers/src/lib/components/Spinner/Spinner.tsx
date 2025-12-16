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
      shouldCloseOnEsc={false}
      shouldCloseOnOverlayClick={false}
      overlayClassName={styles.overlay}
    >
      <div className={styles.spinner} />
    </Modal>
  );
}
