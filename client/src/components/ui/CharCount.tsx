import styles from "./CharCount.module.scss";

interface CharCountProps {
  // linked to the textarea with aria-describedby
  id: string;
  length: number;
  max: number;
}

// how much text is left, shown only once the limit gets close
export function CharCount({ id, length, max }: CharCountProps) {
  if (length < max * 0.8) return null;

  return (
    <p
      id={id}
      className={`${styles.count} ${length >= max ? styles.full : ""}`}
      data-cy="char-count"
    >
      {length.toLocaleString("en-GB")} / {max.toLocaleString("en-GB")}
    </p>
  );
}
