import type { ReactNode } from "react";
import { useNotifications } from "../../queries";
import styles from "./PageLayout.module.scss";

interface PageLayoutProps {
  // the browser tab title, read first by screen readers on every page change
  title: string;
  // false when the page shows its own h1
  heading?: boolean;
  children: ReactNode;
  // the side column, shown next to the page on wider screens
  aside?: ReactNode;
}

export function PageLayout({
  title,
  heading = true,
  children,
  aside,
}: PageLayoutProps) {
  const { data } = useNotifications();
  const unseen = data?.unseen ?? 0;
  const count = unseen > 0 ? `(${unseen > 9 ? "9+" : unseen}) ` : "";

  return (
    <div className={styles.layout}>
      <title>{`${count}${title} · Odinbook`}</title>
      <main id="main" className={styles.main} tabIndex={-1}>
        {heading && <h1 className={styles.srOnly}>{title}</h1>}
        {children}
      </main>
      {aside && <aside className={styles.aside}>{aside}</aside>}
    </div>
  );
}
