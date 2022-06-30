import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { Signin } from "./components/Signin/Signin";
import { Login } from "./components/Login/Login";
import { Home } from "./components/Home/Home";
import { Navbar } from "./components/Navbar/Navbar";
import { Profile } from "./components/Profile/Profile";
import { Friends } from "./components/Friends/Friends";
import { SearchPage } from "./components/SearchPage/SearchPage";
import { FriendRequests } from "./components/FriendRequests/FriendRequests";
import { SuggestedProfile } from "./components/SuggestedProfile/SuggestedProfile";
import { Notifications } from "./components/Notifications/Notifications";
import { SinglePost } from "./components/SinglePost/SinglePost";
import { GenericNotFound } from "./components/GenericNotFound/GenericNotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { UserContext } from "./dataContext/dataContext";
import { SkeletonTheme } from "react-loading-skeleton";

function App() {
  const [isAuth, setIsAuth] = useState(false);

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <SkeletonTheme baseColor="#9b9b9b;" highlightColor="#979797">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login setIsAuth={setIsAuth} />} />
            <Route path="/signin" element={<Signin setIsAuth={setIsAuth} />} />
            <Route element={<ProtectedRoute isAuth={isAuth} />}>
              <Route path="/" element={<Navbar />}>
                <Route path="/home" element={<Home />} />
                <Route path="/profile/:profileId" element={<Profile />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/friendRequests" element={<FriendRequests />} />
                <Route path="/suggestedProfiles" element={<SuggestedProfile/>}/>
                <Route path="/searchPage" element={<SearchPage />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/singlePost/:postId" element={<SinglePost />} />
              </Route>
            </Route>
            <Route path="*" element={<GenericNotFound />} />
          </Routes>
        </BrowserRouter>
      </SkeletonTheme>
    </UserContext.Provider>
  );
}

export default App;
