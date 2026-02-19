import { type ComponentPropsWithoutRef, type FC } from "react";
import styles from "./Button.module.css";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "outlined";
  size?: "small" | "large";
}

const Button: FC<ButtonProps> = ({
  variant = "outlined",
  size = "small",
  className = "",
  children,
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
