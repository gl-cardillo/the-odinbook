import "./App.css";
// the styles are global and shared between pages, so they load up front
// even though the pages themselves are loaded lazily
import "./components/Home/home.css";
import "./components/Post/post.css";
import "./components/PostForm/postform.css";
import "./components/LikeAndComment/likeAndComment.css";
import "./components/Profile/profile.css";
import "./components/About/about.css";
import "./components/SideMenu/sideMenu.css";
import "animate.css";

import axios from "axios";
import { BrowserRouter, Routes, Route } from "react-router";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Signin } from "./components/Signin/Signin";
import { Login } from "./components/Login/Login";
import { Navbar } from "./components/Navbar/Navbar";
import { GenericNotFound } from "./components/GenericNotFound/GenericNotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
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

function App() {
  const [user, setUser] = useState<User | null>(readStorage<User>("user"));

  const login = useCallback((user: User, token: string) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", JSON.stringify(token));
    setAuthToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
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
      <SkeletonTheme baseColor="#9b9b9b;" highlightColor="#979797">
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
                <Route path="*" element={<GenericNotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </SkeletonTheme>
    </UserContext.Provider>
  );
}

export default App;
