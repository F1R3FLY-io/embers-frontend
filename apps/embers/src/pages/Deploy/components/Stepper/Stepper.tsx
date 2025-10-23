import classNames from "classnames";

import { useStepper } from "@/lib/providers/stepper/useStepper";
import CheckIcon from "@/public/icons/check-icon.svg?react";
import StepperCircleIcon from "@/public/icons/stepper-circle-icon.svg?react";
import StepperLineIcon from "@/public/icons/stepper-line-icon.svg?react";

import styles from "./Stepper.module.scss";

type StepperProps = {
  currentStep: number;
  steps: {
    canClick: boolean;
    label: string;
  }[];
};

export default function Stepper({ currentStep, steps }: StepperProps) {
  const { navigateToStep } = useStepper();

  return (
    <div className={styles.stepper}>
      {steps.map((step, index) => (
        <div
          key={index}
          className={styles["step-container"]}
          style={{
            cursor: step.canClick ? "pointer" : undefined,
          }}
          onClick={() => step.canClick && navigateToStep(index)}
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
