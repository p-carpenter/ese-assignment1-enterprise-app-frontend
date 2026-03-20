import type { ReactNode } from "react";
import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className={styles.root}>
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.bgFallback} />
      </div>

      <header className={styles.header}>
        <span className={styles.logo}>AdaStream</span>
      </header>

      <main className={styles.main}>
        <div className={styles.card}>{children}</div>
      </main>
    </div>
  );
};
