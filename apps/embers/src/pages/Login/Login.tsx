import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { ContainerWithLogo } from "@/lib/components/ContainerWithLogo";
import { Text } from "@/lib/components/Text";
import { TextLink } from "@/lib/components/TextLink";
import { WalletInput } from "@/lib/components/WalletInput";
import { useWallet, type WalletDummy } from "@/lib/providers/wallet/useWallet";

import styles from "./Login.module.scss";

type PageState = "init" | "signin" | "creation";

export default function Login() {
  const [pageState, setPageState] = useState<PageState>("init");
  const toSigning = useCallback(() => setPageState("signin"), []);
  const toCreating = useCallback(() => setPageState("creation"), []);

  const navigate = useNavigate();
  const { setWallet } = useWallet();
  const [newWallet, setNewWallet] = useState<WalletDummy>();
  const signin = useCallback(() => {
    if (newWallet) {
      setWallet(newWallet);
      void navigate("/home");
    }
  }, [newWallet, setWallet, navigate]);

  let content;

  switch (pageState) {
    case "creation":
    case "init":
      content = (
        <>
          <div className={styles.title}>
            <Text type="title">Get started F1R3SKY</Text>
          </div>
          <div className={styles.buttons}>
            <Button type="primary" onClick={toSigning}>
              Sign In with F1R3SKY Wallet
            </Button>
            <Button type="secondary" onClick={toCreating}>
              Create Wallet
            </Button>
          </div>
          <div className={styles.note}>
            <Text type="secondary">
              By using F1R3SKY, you agree to the{" "}
              <TextLink onClick={() => {}}>terms and privacy policy</TextLink>
            </Text>
          </div>
        </>
      );
      break;
    case "signin":
      content = (
        <>
          <div className={styles["picker-container"]}>
            <div className={styles.title}>
              <Text type="title">Sign In with F1R3SKY Wallet</Text>
            </div>
            <div className={styles.note}>
              <Text type="secondary">
                Please enter your private key or upload a key file to Sign In.
                <br />
                Make sure you’re using the correct and secure credentials.
              </Text>
            </div>
            <WalletInput onChange={setNewWallet} />
          </div>
          <div className={styles.buttons}>
            <Button type="primary" onClick={signin}>
              Sign In
            </Button>
            <div className={styles.note}>
              <Text type="secondary">
                Don’t have F1R3SKY Wallet?{" "}
                <TextLink onClick={toCreating}>Create one</TextLink>
              </Text>
            </div>
          </div>
        </>
      );
      break;
  }

  return (
    <ContainerWithLogo>
      <div className={styles.container}>{content}</div>
    </ContainerWithLogo>
  );
}
