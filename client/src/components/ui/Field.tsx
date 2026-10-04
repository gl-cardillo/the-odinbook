import type { ReactNode } from "react";
import styles from "./Field.module.scss";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

// a label, the input passed as child and its error underneath
export function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className={styles.error} id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
