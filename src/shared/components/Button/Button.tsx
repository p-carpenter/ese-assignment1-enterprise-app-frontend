import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import styles from "./Button.module.css";

/**
 * Props for `Button` component.
 */
interface ButtonProps extends AriaButtonProps {
  variant?: "primary" | "outlined";
  size?: "small" | "large";
}

export const Button = ({
  variant = "outlined",
  size = "small",
  className = "",
  children,
  ...props
}: ButtonProps) => {
  /**
   * Styled button wrapper around `react-aria-components`' `Button`.
   * @param variant Visual variant of the button.
   * @param size Size of the button.
   * @returns Accessible button element.
   */
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <AriaButton className={classes} {...props}>
      {children}
    </AriaButton>
  );
};
