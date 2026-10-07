import { useSyncExternalStore } from "react";
import {
  BsCheckCircleFill,
  BsExclamationCircleFill,
  BsX,
} from "react-icons/bs";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { answerConfirm, dismissToast, feedbackStore } from "./feedbackStore";
import styles from "./Feedback.module.scss";

export function Feedback() {
  const { confirm, toasts } = useSyncExternalStore(
    feedbackStore.subscribe,
    feedbackStore.getState
  );

  return (
    <>
      <Modal
        open={Boolean(confirm)}
        onClose={() => answerConfirm(false)}
        title={confirm?.title ?? ""}
      >
        {confirm?.message && (
          <p className={styles.message}>{confirm.message}</p>
        )}
        <div className={styles.buttons}>
          <Button
            variant="secondary"
            onClick={() => answerConfirm(false)}
            data-autofocus
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={() => answerConfirm(true)}>
            {confirm?.confirmLabel}
          </Button>
        </div>
      </Modal>

      <div className={styles.toasts} aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.kind]}`}
            role={toast.kind === "error" ? "alert" : "status"}
          >
            <span className={styles.icon} aria-hidden>
              {toast.kind === "success" ? (
                <BsCheckCircleFill />
              ) : (
                <BsExclamationCircleFill />
              )}
            </span>
            <span className={styles.text}>
              <strong>{toast.title}</strong>
              {toast.message && <span>{toast.message}</span>}
            </span>
            <button
              className={styles.close}
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
            >
              <BsX />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
