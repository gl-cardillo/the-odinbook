// the confirm dialog and the toasts, callable from anywhere (even outside react)
// and drawn by <Feedback /> mounted once in App

export interface ConfirmRequest {
  title: string;
  message?: string;
  confirmLabel: string;
  resolve: (confirmed: boolean) => void;
}

export interface Toast {
  id: number;
  kind: "success" | "error";
  title: string;
  message?: string;
}

interface State {
  confirm: ConfirmRequest | null;
  toasts: Toast[];
}

let state: State = { confirm: null, toasts: [] };
const listeners = new Set<() => void>();
let nextId = 1;

const setState = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

export const feedbackStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState: () => state,
};

// resolves true only when the user presses the confirm button
export const confirmDelete = (title: string, message?: string) =>
  new Promise<boolean>((resolve) => {
    // a new question answers the one still open with a no
    state.confirm?.resolve(false);
    setState({ confirm: { title, message, confirmLabel: "Delete", resolve } });
  });

export const answerConfirm = (confirmed: boolean) => {
  state.confirm?.resolve(confirmed);
  setState({ confirm: null });
};

export const dismissToast = (id: number) =>
  setState({ toasts: state.toasts.filter((toast) => toast.id !== id) });

const showToast = (toast: Omit<Toast, "id">, duration: number) => {
  const id = nextId++;
  setState({ toasts: [...state.toasts, { ...toast, id }].slice(-3) });
  setTimeout(() => dismissToast(id), duration);
};

export const toast = {
  success: (title: string) => showToast({ kind: "success", title }, 3000),
  error: (message?: string) =>
    showToast({ kind: "error", title: "Something went wrong", message }, 6000),
};
