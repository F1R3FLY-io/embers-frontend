import type { ChangeEvent } from "react";

import { deserializeKey, PrivateKey } from "@f1r3fly-io/embers-client-sdk";
import { base16 } from "@scure/base";
import { useCallback, useState } from "react";

import { FilePicker } from "@/lib/components/FilePicker";
import { Input } from "@/lib/components/Input";
import { Text } from "@/lib/components/Text";
import UploadIcon from "@/public/icons/download-icon.svg?react";

import styles from "./WalletInput.module.scss";

type WalletInputProps = {
  errorMessage?: string;
  onBlur?: () => void;
  onChange: (key?: PrivateKey) => void;
};

export function WalletInput({
  errorMessage,
  onBlur,
  onChange,
}: WalletInputProps) {
  const [content, setContent] = useState("");
  const [errorState, setErrorState] = useState(false);

  const setWalletFromInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.stopPropagation();
      e.preventDefault();

      const content = e.target.value;

      setContent(content);
      try {
        onChange(PrivateKey.tryFromHex(content));
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
          onChange(privateKey);
          setContent(base16.encode(privateKey.value));
          setErrorState(false);
        } catch {
          onChange(undefined);
          setErrorState(true);
        }
      };
      reader.onerror = () => setErrorState(true);
      reader.readAsText(file);
    },
    [onChange],
  );

  return (
    <div className={styles.container}>
      <Text bold color="secondary" fontSize={13}>
        Private Key
      </Text>
      <Input
        aria-label="Private key"
        errorMessage={
          errorState
            ? "Enter a valid wallet private key or upload a valid wallet JSON file."
            : errorMessage
        }
        rightIcon={
          <FilePicker
            accept={{ "application/json": [".json"] }}
            onChange={setWalletFromFile}
          >
            <UploadIcon className={styles.icon} />
          </FilePicker>
        }
        type="password"
        value={content}
        onBlur={onBlur}
        onChange={setWalletFromInput}
      />
    </div>
  );
}
