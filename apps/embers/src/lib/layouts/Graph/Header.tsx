import type React from "react";

import { Button } from "@/lib/components/Button";

export type HeaderProps = {
  onDeploy: () => void;
  onRun: () => void;
};

export const Header: React.FC<HeaderProps> = ({ onDeploy, onRun }) => {
  return (
    <>
      <Button type="primary" onClick={onDeploy}>
        Deploy
      </Button>
      <Button type="subtle" onClick={onRun}>
        Run
      </Button>
    </>
  );
};
