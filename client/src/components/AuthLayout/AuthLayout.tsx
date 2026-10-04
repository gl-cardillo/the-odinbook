import type { ReactNode } from "react";
import homePic from "../../images/home-pic.png";
import styles from "./AuthLayout.module.scss";

// the brand panel and the form card of the login and signup pages
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <section className={styles.brand}>
        <img className={styles.illustration} src={homePic} alt="" />
        <h1 className={styles.title}>Odinbook</h1>
        <p className={styles.tagline}>
          Connect with friends and the world around you on Odinbook.
        </p>
      </section>
      <section className={styles.card}>{children}</section>
    </main>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className={styles.fieldError} id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
