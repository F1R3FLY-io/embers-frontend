import logo from "../../public/firefly-io.png";

import styles from "./Create.module.scss";

export default function Create() {
  return (
    <div className={styles.container}>
      <img className={styles.logo} src={logo} />
      <div className={styles.title}>Create AI-Agent</div>
    </div>
  );
}
