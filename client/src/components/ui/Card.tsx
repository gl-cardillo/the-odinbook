import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Card.module.scss";

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  // something on the right of the title, like a "See all" link
  action?: ReactNode;
}

export function Card({
  title,
  action,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <section
      className={[styles.card, className].filter(Boolean).join(" ")}
      {...props}
    >
      {(title || action) && (
        <header className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
