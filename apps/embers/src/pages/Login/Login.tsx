import type { Location } from "react-router-dom";

import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { Wallet } from "@/lib/providers/wallet/useWallet";

import { Button } from "@/lib/components/Button";
import { ContainerWithLogo } from "@/lib/components/ContainerWithLogo";
import { Text } from "@/lib/components/Text";
import { TextLink } from "@/lib/components/TextLink";
import { WalletInput } from "@/lib/components/WalletInput";
import { useWalletState } from "@/lib/providers/wallet/useWallet";

import styles from "./Login.module.scss";

type PageState = "init" | "signin";
type WalletControlState = {
  touched: boolean;
  wallet: Wallet | undefined;
};

export default function Login() {
  const [pageState, setPageState] = useState<PageState>("init");
  const toSigning = useCallback(() => setPageState("signin"), []);
  const redirectToFiresky = useCallback(() => {}, []);

  const navigate = useNavigate();
  const location = useLocation() as Location<{ from?: string } | undefined>;
  const { setWallet } = useWalletState();
  const [walletInputState, setWalletInputState] = useState<WalletControlState>({
    touched: false,
    wallet: undefined,
  });

  const updateWallet = useCallback((wallet?: Wallet) => {
    setWalletInputState((state) => ({ ...state, wallet }));
  }, []);

  const signin = useCallback(() => {
    if (walletInputState.wallet) {
      setWallet(walletInputState.wallet);
      void navigate(location.state?.from ?? "/dashboard");
    } else {
      setWalletInputState((state) => ({ ...state, touched: true }));
    }
  }, [walletInputState.wallet, setWallet, navigate, location.state?.from]);

  let content;

  switch (pageState) {
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
            <Button type="secondary" onClick={redirectToFiresky}>
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
            <WalletInput
              error={
                walletInputState.touched &&
                walletInputState.wallet === undefined
              }
              onChange={updateWallet}
            />
          </div>
          <div className={styles.buttons}>
            <Button type="primary" onClick={signin}>
              Sign In
            </Button>
            <div className={styles.note}>
              <Text type="secondary">
                Don’t have F1R3SKY Wallet?{" "}
                <TextLink onClick={redirectToFiresky}>Create one</TextLink>
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
