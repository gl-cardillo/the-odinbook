import { Link } from "react-router";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { FriendButton } from "../FriendButton/FriendButton";
import { useSuggestions } from "../../queries";

export function SuggestedProfile() {
  const { data: suggestedProfile } = useSuggestions();

  return (
    <PageLayout aside={<SideMenu />}>
      <div className="suggested-profile-page">
        <h2>People you may know...</h2>
        <div className="suggested-profile-container">
          {!suggestedProfile ? (
            <Skeleton height={80} style={{ margin: "10px 0" }} count={3} />
          ) : suggestedProfile.length > 0 ? (
            // profiles that are not friend with the user
            suggestedProfile.map((profile) => (
              <div className="suggested-profile" key={profile.id}>
                <img
                  src={profile.profilePicUrl}
                  className="avatar-pic"
                  alt="avatar"
                />
                <Link to={`/profile/${profile.id}`}>
                  <p className="username">{profile.fullname}</p>
                </Link>
                <FriendButton profile={profile} />
              </div>
            ))
          ) : (
            <div className="post no-data-available-container">
              <p>No profiles available at the moment</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
