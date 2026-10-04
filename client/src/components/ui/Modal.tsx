import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { BsX } from "react-icons/bs";
import styles from "./Modal.module.scss";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

// a native dialog: Escape closes it and focus stays inside while open
export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      // a click on the backdrop lands on the dialog itself
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            <BsX />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  );
}
