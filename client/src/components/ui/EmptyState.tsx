import type { ReactNode } from "react";
import styles from "./EmptyState.module.scss";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
}

// what a list shows when there is nothing in it
export function EmptyState({ icon, title, children }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <p className={styles.title}>{title}</p>
      {children && <div className={styles.text}>{children}</div>}
    </div>
  );
}
