import { type ReactNode, useCallback } from "react";
import { useDropzone } from "react-dropzone";

import styles from "./FilePicker.module.scss";

type FilePickerProps = {
  children: ReactNode;
  onChange: (file: File) => void;
};

export default function FilePicker({ children, onChange }: FilePickerProps) {
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
  });

  return (
    <div className={styles.pointer} {...getRootProps()}>
      <input {...getInputProps()} />
      {children}
    </div>
  );
}
