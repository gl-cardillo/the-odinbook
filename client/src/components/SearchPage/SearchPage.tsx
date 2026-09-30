import { useLocation, Link } from "react-router";
import { SideMenu } from "../SideMenu/SideMenu";
import type { User } from "../../types";

export function SearchPage() {
  const location = useLocation();
  // the results come from the navbar, they are missing when the page is opened directly
  const state = location.state as { search?: User[] } | null;
  const searchResult = state?.search ?? [];

  return (
    <div className="main-page">
      <div className="search-section">
        <h2>Users found: </h2>
        <div className="search-container">
          {searchResult.map((user, index) => {
            return (
              <Link to={`/profile/${user.id}`} key={index}>
                <div>
                  <img
                    src={user.profilePicUrl}
                    className="avatar-pic"
                    alt="avatar"
                  />
                  <p>{user.fullname}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <SideMenu />
    </div>
  );
}
