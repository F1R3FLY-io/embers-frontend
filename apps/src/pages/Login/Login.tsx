import type { PrivateKey } from "@f1r3fly-io/embers-client-sdk";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Location } from "react-router-dom";
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

  const { t } = useTranslation();

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

  let content: ReactElement;

  switch (pageState) {
    case "init":
      content = (
        <>
          <div className={styles.title}>
            <Text bold color="primary" type="H2">
              {t("login.getStarted")}
            </Text>
          </div>
          <div className={styles.buttons}>
            <Button type="primary" onClick={toSigning}>
              {t("login.signInWithWallet")}
            </Button>
            <Button type="secondary" onClick={redirectToFiresky}>
              {t("login.createWallet")}
            </Button>
          </div>
          <div className={styles.note}>
            <Text color="secondary" type="normal">
              {t("login.agreeTerms")}{" "}
              <TextLink onClick={() => {}}>{t("login.termsPrivacy")}</TextLink>
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
                {t("login.signInWithWallet")}
              </Text>
            </div>
            <div className={styles.note}>
              <Text color="secondary" type="normal">
                {t("login.enterPrivateKey")}
                <br />
                {t("login.useSecureCredentials")}
              </Text>
            </div>
            <WalletInput
              error={walletInputState.touched && walletInputState.key === undefined}
              onChange={updateWallet}
            />
          </div>
          <div className={styles.buttons}>
            <Button type="primary" onClick={signin}>
              {t("login.signIn")}
            </Button>
            <div className={styles.note}>
              <Text color="secondary" type="normal">
                {t("login.dontHaveWallet")}{" "}
                <TextLink onClick={redirectToFiresky}>{t("login.createOne")}</TextLink>
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
