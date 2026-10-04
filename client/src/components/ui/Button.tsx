import { Link } from "react-router";
import type { LinkProps } from "react-router";
import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.scss";

type Variant =
  "primary" | "secondary" | "success" | "danger" | "outline" | "ghost";

interface Look {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const classes = (
  { variant = "primary", size = "md", fullWidth }: Look,
  className?: string
) =>
  [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(" ");

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: Look & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={classes({ variant, size, fullWidth }, className)}
      {...props}
    />
  );
}

// a link that looks like a button
export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  ...props
}: Look & LinkProps) {
  return (
    <Link
      className={classes({ variant, size, fullWidth }, className)}
      {...props}
    />
  );
}
