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
  /**
   * Small footer used beneath auth forms to provide contextual links.
   * @param footerText Lead-in text for the link.
   * @param linkText Visible link text.
   * @param linkTo Destination path for the link.
   * @returns Footer element.
   */
  return (
    <div className={styles.footer}>
      <span className={styles.footerText}>{footerText}</span>
      <Link to={linkTo} className={styles.footerLink}>
        {linkText}
      </Link>
    </div>
  );
};
