import CheckIcon from "@/public/icons/check-icon.svg?react";
import StepperCircleIcon from "@/public/icons/stepper-circle-icon.svg?react";
import StepperLineIcon from "@/public/icons/stepper-line-icon.svg?react";

import styles from "./Stepper.module.scss";

type StepperProps = {
  currentStep?: number;
  labels?: string[];
  steps?: number;
};

export default function Stepper({ currentStep = 1, labels = [], steps = 3 }: StepperProps) {
  return (
    <div className={styles.stepper}>
      {Array.from({ length: steps }, (_, index) => (
        <div key={index} className={styles["step-container"]}>
          <div className={styles["step-content"]}>
            <div
              className={`${styles.circle} ${
                index < currentStep
                  ? styles.completed
                  : index === currentStep - 1
                    ? styles.current
                    : styles.pending
              }`}
            >
              <StepperCircleIcon />
              {index < currentStep && index < currentStep - 1 && (
                <CheckIcon className={styles.checkmark} />
              )}
              {index === currentStep - 1 && <div className={styles.dot} />}
            </div>
            {index < steps - 1 && (
              <div className={styles.line}>
                <StepperLineIcon />
              </div>
            )}
          </div>
          {labels[index] && <div className={styles.label}>{labels[index]}</div>}
        </div>
      ))}
    </div>
  );
}
