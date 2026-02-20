import type { ReactNode } from "react";
import styles from "./AuthLayout.module.css";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <>
      <div className="app-header">
        <h1 className="app-title">Music Player</h1>
      </div>

      <div className={styles.container}>{children}</div>
    </>
  );
};
