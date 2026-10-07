import type { ReactNode } from "react";
import { Link } from "react-router";
import Skeleton from "react-loading-skeleton";
import { Avatar } from "./Avatar";
import type { UserSummary } from "../../types";
import styles from "./PeopleGrid.module.scss";

interface PeopleGridProps<T extends UserSummary> {
  people: T[];
  // a button under the name, like Add or Accept
  action?: (person: T) => ReactNode;
}

// people as tiles with their picture, name and an optional button
export function PeopleGrid<T extends UserSummary>({
  people,
  action,
}: PeopleGridProps<T>) {
  return (
    <ul className={styles.grid}>
      {people.map((person) => (
        <li key={person.id} className={styles.tile} data-cy="person">
          <Link to={`/profile/${person.id}`} className={styles.person}>
            <Avatar
              src={person.profilePicUrl}
              name={person.fullname}
              size="lg"
              alt=""
            />
            <span className={styles.name}>{person.fullname}</span>
          </Link>
          {action?.(person)}
        </li>
      ))}
    </ul>
  );
}

export function PeopleGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className={styles.grid} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <Skeleton height={150} borderRadius={10} />
        </li>
      ))}
    </ul>
  );
}
