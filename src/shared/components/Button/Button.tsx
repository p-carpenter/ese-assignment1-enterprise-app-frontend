import { type ComponentPropsWithoutRef, type ElementType } from "react";
import styles from "./Button.module.css";

type ButtonProps<T extends ElementType = "button"> = {
  as?: T;
  variant?: "primary" | "outlined";
  size?: "small" | "large";
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

export const Button = <T extends ElementType = "button">({
  as,
  variant = "outlined",
  size = "small",
  className = "",
  children,
  ...props
}: ButtonProps<T>) => {
  const Component = as ?? "button";
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};
