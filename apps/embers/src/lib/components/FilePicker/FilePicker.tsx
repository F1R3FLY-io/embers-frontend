import type { ReactNode } from "react";
import type { Accept } from "react-dropzone";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import styles from "./FilePicker.module.scss";

type FilePickerProps = {
  accept?: Accept;
  children: ReactNode;
  onChange: (file: File) => void;
};

export function FilePicker({ accept, children, onChange }: FilePickerProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles.at(0);
      if (file) {
        onChange(file);
      }
    },
    [onChange],
  );

  const { getInputProps, getRootProps } = useDropzone({
    maxFiles: 1,
    onDrop,
    ...(accept === undefined ? {} : { accept }),
  });

  return (
    <div className={styles.pointer} {...getRootProps()}>
      <input {...getInputProps()} />
      {children}
    </div>
  );
}
