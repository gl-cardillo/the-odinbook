import type { ReactNode } from "react";
import homePic from "../../images/home-pic.png";
import styles from "./StatusPage.module.scss";

interface StatusPageProps {
  code?: string;
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  role?: string;
}

// a full page message, for a missing page or a crash
export function StatusPage({
  code,
  title,
  children,
  actions,
  role,
}: StatusPageProps) {
  return (
    <main className={styles.page} role={role}>
      <title>{`${title} · Odinbook`}</title>
      <div className={styles.card}>
        <img className={styles.image} src={homePic} alt="" />
        {code && <p className={styles.code}>{code}</p>}
        <h1 className={styles.title}>{title}</h1>
        {children && <p className={styles.text}>{children}</p>}
        <div className={styles.actions}>{actions}</div>
      </div>
    </main>
  );
}
