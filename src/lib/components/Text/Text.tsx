import styles from "./Text.module.scss";

type TextProps = { children: string } & (
  | {
      type: "text";
      fontSize?: number;
      fontWeight?: number;
    }
  | {
      type: "title";
    }
);

export default function Text(prop: TextProps) {
  let fontSize = null;
  let fontWeight = null;

  switch (prop.type) {
    case "text":
      fontSize = prop.fontSize;
      fontWeight = prop.fontWeight;
      break;
    case "title":
      fontSize = 32;
      fontWeight = 600;
      break;
  }

  return (
    <div style={{ fontSize, fontWeight }} className={styles.text}>
      {prop.children}
    </div>
  );
}
