import type { PrivateKey } from "@f1r3fly-io/embers-client-sdk";

import { useForm } from "@tanstack/react-form";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import z from "zod";

import { Button } from "@/lib/components/Button";
import { Text } from "@/lib/components/Text";
import { TextLink } from "@/lib/components/TextLink";
import { WalletInput } from "@/lib/components/WalletInput";
import { useWalletState } from "@/lib/providers/wallet/useApi";
import logo from "@/public/icons/firefly-io.png";

import styles from "./Login.module.scss";

const formModel = z.object({
  key: z.custom<PrivateKey | undefined>((v) => !!v),
});

// The auth return-path contract: ProtectedRoute and the run inspector send
// the location they bounced from as `state.from`; after a successful sign-in
// the user lands back there. The pathname must be an app-internal path (a
// protocol-relative "//host" escape is rejected), and zod strips unknown
// keys, so the parsed value is a clean partial path `navigate` accepts.
const locationStateModel = z.object({
  from: z.object({
    hash: z.string(),
    pathname: z.string().regex(/^\/(?!\/)/),
    search: z.string(),
  }),
});

function returnTarget(state: unknown) {
  const parsed = locationStateModel.safeParse(state);
  return parsed.success ? parsed.data.from : undefined;
}

type PageState = "init" | "signin";

export default function Login() {
  const [pageState, setPageState] = useState<PageState>("init");
  const toSigning = useCallback(() => setPageState("signin"), []);
  const redirectToFiresky = useCallback(() => {}, []);

  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();
  const { setKey } = useWalletState();

  const form = useForm({
    defaultValues: {
      key: undefined,
    } as z.infer<typeof formModel>,
    onSubmit: async ({ value }) => {
      setKey(value.key);
      return navigate(returnTarget(location.state) ?? "/dashboard", {
        replace: true,
      });
    },
    validators: {
      onChange: formModel,
    },
  });

  let content;

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
            <Button type="subtle" onClick={redirectToFiresky}>
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
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
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
            <form.Field name="key">
              {(field) => <WalletInput onChange={field.handleChange} />}
            </form.Field>
          </div>
          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <div className={styles.buttons}>
                <Button submit disabled={isSubmitting} type="primary">
                  {t("login.signIn")}
                </Button>
                <div className={styles.note}>
                  <Text color="secondary" type="normal">
                    {t("login.dontHaveWallet")}{" "}
                    <TextLink onClick={redirectToFiresky}>
                      {t("login.createOne")}
                    </TextLink>
                  </Text>
                </div>
              </div>
            )}
          </form.Subscribe>
        </form>
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
