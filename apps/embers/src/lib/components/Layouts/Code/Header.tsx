import type React from "react";

import { Button } from "@/lib/components/Button";

const CodeHeader: React.FC = () => {
  return (
    <>
      <Button type={"primary"} onClick={() => console.log("deploy")}>
        Deploy
      </Button>
    </>
  );
};

export default CodeHeader;
