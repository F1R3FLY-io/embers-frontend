import type { PrivateKey } from "@f1r3fly-io/embers-client-sdk";
import type { Location } from "react-router-dom";

import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/lib/components/Button";
import { Text } from "@/lib/components/Text";
import { TextLink } from "@/lib/components/TextLink";
import { WalletInput } from "@/lib/components/WalletInput";
import { useWalletState } from "@/lib/providers/wallet/useApi";
import logo from "@/public/icons/firefly-io.png";

import styles from "./Login.module.scss";

type PageState = "init" | "signin";
type WalletControlState = {
  key: PrivateKey | undefined;
  touched: boolean;
};

export default function Login() {
  const [pageState, setPageState] = useState<PageState>("init");
  const toSigning = useCallback(() => setPageState("signin"), []);
  const redirectToFiresky = useCallback(() => {}, []);

  const navigate = useNavigate();
  const location = useLocation() as Location<{ from?: string } | undefined>;
  const { setKey } = useWalletState();
  const [walletInputState, setWalletInputState] = useState<WalletControlState>({
    key: undefined,
    touched: false,
  });

  const updateWallet = useCallback((key?: PrivateKey) => {
    setWalletInputState((state) => ({ ...state, key }));
  }, []);

  const signin = useCallback(() => {
    if (walletInputState.key) {
      setKey(walletInputState.key);
      void navigate(location.state?.from ?? "/dashboard");
    } else {
      setWalletInputState((state) => ({ ...state, touched: true }));
    }
  }, [walletInputState.key, setKey, navigate, location.state?.from]);

  let content;

  switch (pageState) {
    case "init":
      content = (
        <>
          <div className={styles.title}>
            <Text bold color="primary" type="H2">
              Get started with F1R3SKY
            </Text>
          </div>
          <div className={styles.buttons}>
            <Button type="primary" onClick={toSigning}>
              Sign in with F1R3SKY Wallet
            </Button>
            <Button type="secondary" onClick={redirectToFiresky}>
              Create Wallet
            </Button>
          </div>
          <div className={styles.note}>
            <Text color="secondary" type="normal">
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
              <Text bold color="primary" type="H2">
                Sign in with F1R3SKY Wallet
              </Text>
            </div>
            <div className={styles.note}>
              <Text color="secondary" type="normal">
                Please enter your private key or upload a key file to sign in.
                <br />
                Make sure you&apos;re using the correct credentials.
              </Text>
            </div>
            <WalletInput
              error={
                walletInputState.touched && walletInputState.key === undefined
              }
              onChange={updateWallet}
            />
          </div>
          <div className={styles.buttons}>
            <Button type="primary" onClick={signin}>
              Sign In
            </Button>
            <div className={styles.note}>
              <Text color="secondary" type="normal">
                Don&apos;t have F1R3SKY Wallet?{" "}
                <TextLink onClick={redirectToFiresky}>Create one</TextLink>
              </Text>
            </div>
          </div>
        </>
      );
      break;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <img className={styles.logo} src={logo} />
        {content}
      </div>
    </div>
  );
}
