import classNames from "classnames";

import CheckIcon from "@/public/icons/check-icon.svg?react";
import StepperCircleIcon from "@/public/icons/stepper-circle-icon.svg?react";
import StepperLineIcon from "@/public/icons/stepper-line-icon.svg?react";

import styles from "./Stepper.module.scss";

type StepperProps = {
  currentStep: number;
  onStepClick?: (index: number) => void;
  steps: { canClick?: boolean; label: string }[];
};

export function Stepper({ currentStep, onStepClick, steps }: StepperProps) {
  return (
    <div className={styles.stepper}>
      {steps.map((step, index) => (
        <div
          key={index}
          className={styles["step-container"]}
          style={{ cursor: step.canClick ? "pointer" : undefined }}
          onClick={() => step.canClick && onStepClick?.(index)}
        >
          <div className={styles["step-content"]}>
            <div
              className={classNames(styles.circle, {
                [styles.completed]: index < currentStep,
                [styles.current]: index === currentStep,
                [styles.pending]: index > currentStep,
              })}
            >
              <StepperCircleIcon />
              {index < currentStep && (
                <CheckIcon className={styles.checkmark} />
              )}
              {index === currentStep && <div className={styles.dot} />}
            </div>
            {index < steps.length - 1 && (
              <div className={styles.line}>
                <StepperLineIcon />
              </div>
            )}
          </div>
          <div className={styles.label}>{step.label}</div>
        </div>
      ))}
    </div>
  );
}
