import axios from "axios";

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
