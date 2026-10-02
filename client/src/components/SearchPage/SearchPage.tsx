import { Link, useSearchParams } from "react-router";
import { SideMenu } from "../SideMenu/SideMenu";
import { useSearch } from "../../queries";

// the search is in the url (/searchPage?q=...), so it survives a refresh
export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const { data: results = [], isLoading } = useSearch(q);

  return (
    <div className="main-page">
      <div className="search-section">
        <h2>Users found: </h2>
        <div className="search-container">
          {!isLoading && results.length === 0 && <p>No users found</p>}
          {results.map((user) => (
            <Link to={`/profile/${user.id}`} key={user.id}>
              <div>
                <img
                  src={user.profilePicUrl}
                  className="avatar-pic"
                  alt="avatar"
                />
                <p>{user.fullname}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <SideMenu />
    </div>
  );
}
