import { type FC } from "react";
import { Link } from "react-router-dom";
import styles from "./AuthFormFooter.module.css";

interface AuthFormFooterProps {
  footerText: string;
  linkText: string;
  linkTo: string;
}

export const AuthFormFooter: FC<AuthFormFooterProps> = ({
  footerText,
  linkText,
  linkTo,
}) => {
  return (
    <div className={styles.footer}>
      <span className={styles.footerText}>{footerText}</span>
      <Link to={linkTo} className={styles.footerLink}>
        {linkText}
      </Link>
    </div>
  );
};
