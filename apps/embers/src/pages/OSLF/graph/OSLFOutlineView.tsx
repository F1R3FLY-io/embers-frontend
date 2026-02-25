import styles from "./GraphOSLF.module.scss";

type Props = {
  code: string;
};

export function OSLFOutlineView({ code }: Props) {
  return <div className={styles["oslf-tree"]}>{code || "// no code yet"}</div>;
}
