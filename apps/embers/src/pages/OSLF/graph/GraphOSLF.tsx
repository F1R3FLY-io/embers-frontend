import { OSLFLayout } from "@/lib/layouts/OSLF";

import styles from "./GraphOSLF.module.scss";
import { OSLFEditorShell } from "./OSLFEditorShell";

export default function GraphOSLF() {
  return (
    <OSLFLayout title="MyProcessQuery">
      <div className={styles["oslf-root"]}>
        <OSLFEditorShell onChange={() => {}} />
      </div>
    </OSLFLayout>
  );
}
