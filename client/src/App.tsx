import "react-loading-skeleton/dist/skeleton.css";
import "./styles/global.scss";
import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Signin } from "./components/Signin/Signin";
import { Login } from "./components/Login/Login";
import { Navbar } from "./components/Navbar/Navbar";
import { GenericNotFound } from "./components/GenericNotFound/GenericNotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import { Feedback } from "./components/ui";
import { UserContext } from "./dataContext/dataContext";
import { SkeletonTheme } from "react-loading-skeleton";
import { readStorage, setAuthToken } from "./utils/utils";
import { queryClient } from "./queries";
import type { User } from "./types";

// pages behind the login are downloaded only when first opened
const Home = lazy(() =>
  import("./components/Home/Home").then((m) => ({ default: m.Home }))
);
const Profile = lazy(() =>
  import("./components/Profile/Profile").then((m) => ({ default: m.Profile }))
);
const Friends = lazy(() =>
  import("./components/Friends/Friends").then((m) => ({ default: m.Friends }))
);
const SearchPage = lazy(() =>
  import("./components/SearchPage/SearchPage").then((m) => ({
    default: m.SearchPage,
  }))
);
const FriendRequests = lazy(() =>
  import("./components/FriendRequests/FriendRequests").then((m) => ({
    default: m.FriendRequests,
  }))
);
const SuggestedProfile = lazy(() =>
  import("./components/SuggestedProfile/SuggestedProfile").then((m) => ({
    default: m.SuggestedProfile,
  }))
);
const Notifications = lazy(() =>
  import("./components/Notifications/Notifications").then((m) => ({
    default: m.Notifications,
  }))
);
const SinglePost = lazy(() =>
  import("./components/SinglePost/SinglePost").then((m) => ({
    default: m.SinglePost,
  }))
);
// left out of production builds
const UiPreview = import.meta.env.DEV
  ? lazy(() =>
      import("./components/ui/UiPreview").then((m) => ({
        default: m.UiPreview,
      }))
    )
  : null;

function App() {
  const [user, setUser] = useState<User | null>(readStorage<User>("user"));

  const login = useCallback((user: User, token: string) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", JSON.stringify(token));
    setAuthToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    // the theme is a choice of this device, not of the account
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setAuthToken(null);
    queryClient.clear();
    setUser(null);
  }, []);

  const updateUser = useCallback((user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }, []);

  // an expired or invalid session logs the user out instead of failing every request
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(undefined, (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
      }
      return Promise.reject(err);
    });
    return () => axios.interceptors.response.eject(interceptor);
  }, [logout]);

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      <SkeletonTheme
        baseColor="var(--color-neutral)"
        highlightColor="var(--color-background)"
      >
        <ErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/signin" element={<Signin />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Navbar />}>
                    <Route path="/home" element={<Home />} />
                    <Route path="/profile/:profileId" element={<Profile />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route
                      path="/friendRequests"
                      element={<FriendRequests />}
                    />
                    <Route
                      path="/suggestedProfiles"
                      element={<SuggestedProfile />}
                    />
                    <Route path="/searchPage" element={<SearchPage />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route
                      path="/singlePost/:postId"
                      element={<SinglePost />}
                    />
                  </Route>
                </Route>
                {UiPreview && <Route path="/ui" element={<UiPreview />} />}
                <Route path="*" element={<GenericNotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Feedback />
        </ErrorBoundary>
      </SkeletonTheme>
    </UserContext.Provider>
  );
}

export default App;
