import type { ReactNode } from "react";
import styles from "./Alert.module.scss";

// an error message read out by screen readers as soon as it appears
export function Alert({ children }: { children: ReactNode }) {
  return (
    <p className={styles.alert} role="alert">
      {children}
    </p>
  );
}
