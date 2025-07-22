import { Button } from "@/lib/components/Button";
import { ContainerWithLogo } from "@/lib/components/ContainerWithLogo";
import { Text } from "@/lib/components/Text";

import styles from "./Login.module.scss";

export default function Login() {
  return (
    <ContainerWithLogo>
      <div className={styles.container}>
        <div className={styles.title}>
          <Text type="title">Get started F1R3SKY</Text>
        </div>
        <div className={styles.buttons}>
          <Button type="primary" onClick={() => {}}>
            Sign In with F1R3SKY Wallet
          </Button>
          <Button type="secondary" onClick={() => {}}>
            Create Wallet
          </Button>
        </div>
        <div className={styles.note}>
          <Text type="secondary">
            By using F1R3SKY, you agree to the terms and privacy policy
          </Text>
        </div>
      </div>
    </ContainerWithLogo>
  );
}
