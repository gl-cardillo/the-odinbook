import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { User } from "../types";

interface UserContextValue {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
}

export const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => {},
});

// for pages behind ProtectedRoute, where the user is always logged in
export function useCurrentUser() {
  const { user, setUser } = useContext(UserContext);
  if (!user) {
    throw new Error("useCurrentUser must be used when logged in");
  }
  return { user, setUser };
}
