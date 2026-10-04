import type { ReactNode } from "react";
import { Link } from "react-router";
import { Avatar } from "./Avatar";
import type { UserSummary } from "../../types";
import styles from "./PersonRow.module.scss";

interface PersonRowProps {
  person: UserSummary;
  subtitle?: ReactNode;
  action?: ReactNode;
  size?: "sm" | "md" | "lg";
}

// a person with a link to their profile and an optional button on the right
export function PersonRow({
  person,
  subtitle,
  action,
  size = "md",
}: PersonRowProps) {
  return (
    <div className={styles.row}>
      <Link to={`/profile/${person.id}`} className={styles.person}>
        <Avatar
          src={person.profilePicUrl}
          name={person.fullname}
          size={size}
          alt=""
        />
        <span className={styles.text}>
          <span className={styles.name}>{person.fullname}</span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </span>
      </Link>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
