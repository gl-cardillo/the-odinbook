import { useState } from "react";
import styles from "./Avatar.module.scss";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  // empty when the name is written next to the picture
  alt?: string;
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

// the picture, or the initials when there is none or it fails to load
export function Avatar({ src, name, size = "md", alt = name }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const className = `${styles.avatar} ${styles[size]}`;

  // an empty space of the same size when there is no user (deleted account)
  if (!name) {
    return <span className={`${className} ${styles.blank}`} aria-hidden />;
  }
  if (!src || failedSrc === src) {
    return (
      <span
        className={`${className} ${styles.initials}`}
        role="img"
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setFailedSrc(src)}
    />
  );
}
