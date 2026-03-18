import { Link, type LinkProps } from "react-router-dom";
import styles from "./Button.module.css";

interface LinkButtonProps extends LinkProps {
  variant?: "primary" | "outlined";
  size?: "small" | "large";
}

export const LinkButton = ({
  variant = "outlined",
  size = "small",
  className = "",
  children,
  ...props
}: LinkButtonProps) => {
  const classes = [
    styles.button,
    styles.linkOverride,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link className={classes} {...props}>
      {children}
    </Link>
  );
};
