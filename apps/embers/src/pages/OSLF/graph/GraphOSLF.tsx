import { useCallback } from "react";

import { OSLFLayout } from "@/lib/layouts/OSLF";

import styles from "./GraphOSLF.module.scss";
import { OSLFEditorShell } from "./OSLFEditorShell";

export default function GraphOSLF() {
  const handleChange = useCallback(
    ({ code, state }: { code: string; state: object }) => {
      console.log("OSLF code:", code);
      console.log("OSLF state:", state);
    },
    [],
  );

  return (
    <OSLFLayout title="MyProcessQuery">
      <div className={styles["oslf-root"]}>
        <OSLFEditorShell onChange={handleChange} />
      </div>
    </OSLFLayout>
  );
}
