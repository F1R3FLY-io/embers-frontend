import { base16 } from "@scure/base";
import classNames from "classnames";
import { deserializeKey, PrivateKey } from "embers-client-sdk";
import { type ChangeEvent, useCallback, useEffect, useState } from "react";

import { FilePicker } from "@/lib/components/FilePicker";
import { Text } from "@/lib/components/Text";
import { type Wallet } from "@/lib/providers/wallet/useWallet";
import UploadIcon from "@/public/icons/upload-icon.svg";

import styles from "./WalletInput.module.scss";

type WalletInputProps = {
  error?: boolean;
  onChange: (wallet?: Wallet) => void;
};

export default function WalletInput({ error, onChange }: WalletInputProps) {
  const [errorState, setErrorState] = useState(false);
  useEffect(() => {
    if (error) {
      setErrorState(error);
    }
  }, [error]);

  const [content, setContent] = useState("");

  const setWalletFromInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      e.preventDefault();

      const content = e.target.value;

      setContent(content);
      try {
        onChange({ privateKey: PrivateKey.tryFromHex(content) });
        setErrorState(false);
      } catch {
        onChange(undefined);
        setErrorState(true);
      }
    },
    [onChange],
  );

  const setWalletFromFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const privateKey = deserializeKey(reader.result as string);
          onChange({ privateKey });
          setContent(base16.encode(privateKey.value));
          setErrorState(false);
        } catch {
          setErrorState(true);
        }
      };
      reader.onerror = () => setErrorState(true);
      reader.readAsText(file);
    },
    [onChange],
  );

  const inputAreaClass = classNames(styles["input-area"], {
    [styles.error]: errorState,
  });

  return (
    <div className={styles.container}>
      <Text fontSize={13} fontWeight={600} type="secondary">
        Private Key
      </Text>
      <div className={inputAreaClass}>
        <input
          className={styles.input}
          type="password"
          value={content}
          onChange={setWalletFromInput}
        />
        <FilePicker onChange={setWalletFromFile}>
          <img className={styles.icon} src={UploadIcon} />
        </FilePicker>
      </div>
    </div>
  );
}
