import { createContext, useContext } from "react";
import type { User } from "../types";

interface UserContextValue {
  user: User | null;
  // stores the session after login or signup
  login: (user: User, token: string) => void;
  // forgets the session and every cached response
  logout: () => void;
  // keeps the stored user in sync after a profile change
  updateUser: (user: User) => void;
}

export const UserContext = createContext<UserContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

// for pages behind ProtectedRoute, where the user is always logged in
export function useCurrentUser() {
  const { user, ...actions } = useContext(UserContext);
  if (!user) {
    throw new Error("useCurrentUser must be used when logged in");
  }
  return { user, ...actions };
}
