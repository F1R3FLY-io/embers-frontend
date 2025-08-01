import styles from "./Stepper.module.scss";

type StepperProps = {
  currentStep?: number;
  labels?: string[];
  steps?: number;
};

export default function Stepper({
  currentStep = 1,
  labels = [],
  steps = 3,
}: StepperProps) {
  return (
    <div className={styles.stepper}>
      {Array.from({ length: steps }, (_, index) => (
        <div key={index} className={styles.stepContainer}>
          <div className={styles.stepContent}>
            <svg
              className={styles.circle}
              fill="none"
              height="24"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                fill={index < currentStep ? "#8B5CF6" : "transparent"}
                r="10"
                stroke="#8B5CF6"
                strokeWidth="2"
              />
              {index < currentStep && index < currentStep - 1 && (
                <path
                  d="M9 12l2 2 4-4"
                  fill="none"
                  stroke="#10B981"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              )}
              {index === currentStep - 1 && (
                <circle cx="12" cy="12" fill="white" r="4" />
              )}
            </svg>
            {index < steps - 1 && (
              <div className={styles.line}>
                <svg
                  fill="none"
                  height="2"
                  viewBox="0 0 60 2"
                  width="60"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    stroke="#8B5CF6"
                    strokeWidth="2"
                    x1="0"
                    x2="60"
                    y1="1"
                    y2="1"
                  />
                </svg>
              </div>
            )}
          </div>
          {labels[index] && <div className={styles.label}>{labels[index]}</div>}
        </div>
      ))}
    </div>
  );
}
