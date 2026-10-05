import "./home.css";
import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { PostForm } from "../PostForm/PostForm";
import { PostList } from "../PostList/PostList";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { FriendButton } from "../FriendButton/FriendButton";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useFeed, useSuggestions } from "../../queries";

export function Home() {
  const { user } = useCurrentUser();
  const { data: suggestedProfile } = useSuggestions(3);
  const feed = useFeed();

  return (
    <PageLayout aside={<SideMenu />}>
      <div className="containers">
        <PostForm user={user} />
        <div>
          {suggestedProfile ? (
            // show profiles the user is not friend with
            suggestedProfile.length > 0 && (
              <div className="home-suggested-profile-container">
                <h3>People you may know...</h3>
                <div className="home-suggested-profile">
                  {suggestedProfile.map((profile) => (
                    <div key={profile.id}>
                      <Link to={`/profile/${profile.id}`}>
                        <img
                          src={profile.profilePicUrl}
                          className="avatar-pic"
                          alt="avatar"
                        />
                      </Link>
                      <Link to={`/profile/${profile.id}`}>
                        <p className="none1024px">{profile.firstname}</p>
                      </Link>
                      <Link to={`/profile/${profile.id}`}>
                        <p className="none1024px">{profile.lastname}</p>
                      </Link>
                      <Link to={`/profile/${profile.id}`}>
                        <p className="block1024px">{profile.fullname}</p>
                      </Link>
                      <FriendButton profile={profile} />
                    </div>
                  ))}
                </div>
                <Link to={"/suggestedProfiles"}>
                  <p className="see-more">See more...</p>
                </Link>
              </div>
            )
          ) : (
            <Skeleton height={150} style={{ margin: "10px 0" }} />
          )}
        </div>
        <PostList query={feed} emptyText="No post at the moment" />
      </div>
    </PageLayout>
  );
}
