import type { ReactNode } from "react";
import styles from "./PageLayout.module.scss";

interface PageLayoutProps {
  children: ReactNode;
  // the side column, shown next to the page on wider screens
  aside?: ReactNode;
}

export function PageLayout({ children, aside }: PageLayoutProps) {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>{children}</main>
      {aside && <aside className={styles.aside}>{aside}</aside>}
    </div>
  );
}
