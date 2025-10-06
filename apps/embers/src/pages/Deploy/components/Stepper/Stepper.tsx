import { useStepper } from "@/lib/providers/stepper/useStepper";
import CheckIcon from "@/public/icons/check-icon.svg?react";
import StepperCircleIcon from "@/public/icons/stepper-circle-icon.svg?react";
import StepperLineIcon from "@/public/icons/stepper-line-icon.svg?react";

import styles from "./Stepper.module.scss";

type StepperProps = {
  currentStep?: number;
  labels?: string[];
  steps?: number;
};

export default function Stepper({
  currentStep = 0,
  labels = [],
  steps = 3,
}: StepperProps) {
  const { navigateToStep } = useStepper();

  return (
    <div className={styles.stepper}>
      {Array.from({ length: steps }, (_, index) => (
        <div
          key={index}
          className={styles["step-container"]}
          style={{
            cursor: index <= currentStep ? "pointer" : "not-allowed",
          }}
          onClick={() => navigateToStep(index)}
        >
          <div className={styles["step-content"]}>
            <div
              className={`${styles.circle} ${
                index < currentStep
                  ? styles.completed
                  : index === currentStep
                    ? styles.current
                    : styles.pending
              }`}
            >
              <StepperCircleIcon />
              {index < currentStep && (
                <CheckIcon className={styles.checkmark} />
              )}
              {index === currentStep && <div className={styles.dot} />}
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
