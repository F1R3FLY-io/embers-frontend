import classNames from "classnames";
import { type ChangeEvent, useCallback, useState } from "react";

import type { WalletDummy } from "@/lib/providers/wallet/useWallet";

import { FilePicker } from "@/lib/components/FilePicker";
import { Text } from "@/lib/components/Text";
import UploadIcon from "@/public/icons/upload-icon.svg";

import styles from "./WalletInput.module.scss";

type WalletInputProps = {
  error?: boolean;
  onChange: (wallet?: WalletDummy) => void;
};

export default function WalletInput({ error, onChange }: WalletInputProps) {
  const [errorState, setErrorState] = useState(error);
  const [content, setContent] = useState("");

  const setWallet = useCallback(
    (content: string) => {
      setContent(content);
      onChange(null);
    },
    [onChange],
  );

  const setWalletFromInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      e.preventDefault();
      setWallet(e.target.value);
    },
    [setWallet],
  );

  const setWalletFromFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => setWallet(reader.result as string);
      reader.onerror = () => setErrorState(true);
      reader.readAsText(file);
    },
    [setWallet],
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
