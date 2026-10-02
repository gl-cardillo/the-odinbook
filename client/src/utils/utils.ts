import axios from "axios";
import Swal from "sweetalert2";
import type { SweetAlertOptions } from "sweetalert2";

// message sent by the API, or the error itself if the request never got an answer
export const errorMessage = (err: unknown): string | undefined => {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message ?? err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return undefined;
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

export function readStorage<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export const imageTypes = [
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
];

export function nFormatter(n: number) {
  if (n > 999999) {
    return `${n / 1000000}m`;
  } else if (n > 999) {
    return `${n / 1000}k`;
  }
  return n;
}

export function getTime(time: string | number) {
  const timePassed = Date.now() - new Date(time).getTime();
  const seconds = timePassed / 1000;
  if (seconds < 60) {
    return "now";
  } else if (seconds < 3600) {
    if (seconds / 60 === 1) {
      return "1 minute ago";
    }
    return `${Math.floor(seconds / 60)} minutes ago`;
  } else if (seconds < 86400) {
    if (seconds / 3600 === 1) {
      return "1 hour ago";
    }
    return `${Math.floor(seconds / 3600)} hours ago`;
  } else if (seconds < 2419200) {
    if (seconds / 86400 === 1) {
      return "1 day ago";
    }
    return `${Math.floor(seconds / 86400)} days ago`;
  } else {
    const date = new Date(time);
    return date.toLocaleDateString("en-UK");
  }
}

export const swalStyle: SweetAlertOptions = {
  allowOutsideClick: false,
  backdrop: false,
  customClass: {
    popup: "swal-popup dark-mode",
    actions: "swal-actions",
    confirmButton: "swal-confirm-button",
    cancelButton: "swal-cancel-button",
    title: "swal-title dark-mode",
    htmlContainer: "swal-html-container dark-mode",
  },
  showClass: {
    popup: "animate__animated animate__slideInDown animate__faster",
  },
  hideClass: {
    popup: "animate__animated animate__fadeOutUp animate__faster",
  },
};

export const handleError = (text?: string) => {
  Swal.fire({
    title: "Something went wrong",
    text,
    position: "top",
    confirmButtonText: "Close",
    ...swalStyle,
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.close();
    }
  });
};

export const handleSuccess = (title: string, refresh = false) => {
  Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2000,
  })
    .fire({
      icon: "success",
      title,
    })
    .then((result) => {
      if (result.isConfirmed) {
        if (refresh) {
          window.location.reload();
        }
        Swal.close();
      }
    });
};

// asks before deleting something, resolves true only on "Delete"
export const confirmDelete = async (title: string) => {
  const result = await Swal.fire({
    title,
    position: "top",
    showCancelButton: true,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
    ...swalStyle,
    customClass: {
      ...(swalStyle.customClass as object),
      confirmButton: "swal-danger-button",
      cancelButton: "swal-neutral-button",
    },
  });
  return result.isConfirmed;
};
