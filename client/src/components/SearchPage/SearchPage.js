import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { SideMenu } from "../SideMenu/SideMenu";

export function SearchPage() {
  const data = useLocation();
  const searchResult = data.state.search;
  const [render, setRender] = useState(0);

  return (
    <div className="main-page">
      <div className="search-section">
        <h2>Users found: </h2>
        <div className="search-container">
          {searchResult.map((user, index) => {
            return (
              <Link to={`/profile/${user.id}`}>
                <div key={index}>
                  <img src={user.profilePicUrl} alt="avatar" />
                  <p>{user.fullname}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <SideMenu render={render} setRender={setRender} />
    </div>
  );
}
