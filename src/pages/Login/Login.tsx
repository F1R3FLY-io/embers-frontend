import { Button } from "@/lib/components/Button";
import { ContainerWithLogo } from "@/lib/components/ContainerWithLogo";
import { Text } from "@/lib/components/Text";

import styles from "./Login.module.scss";

export default function Login() {
  return (
    <ContainerWithLogo>
      <div style={{ height: 56 }}>
        <Text type="title">Get started F1R3SKY</Text>
      </div>
      <div className={styles.buttonsContainer}>
        <Button type="primary" onClick={() => {}} />
        <Button type="secondary" onClick={() => {}} />
      </div>
    </ContainerWithLogo>
  );
}
