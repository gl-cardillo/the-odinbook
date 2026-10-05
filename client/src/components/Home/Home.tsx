import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { PostForm } from "../PostForm/PostForm";
import { PostList } from "../PostList/PostList";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { FriendButton } from "../FriendButton/FriendButton";
import { Avatar, Card } from "../ui";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useFeed, useSuggestions } from "../../queries";
import styles from "./Home.module.scss";

export function Home() {
  const { user } = useCurrentUser();
  const { data: suggestedProfile } = useSuggestions(3);
  const feed = useFeed();

  return (
    <PageLayout aside={<SideMenu />}>
      <div className={styles.feed}>
        <PostForm user={user} />
        {!suggestedProfile ? (
          <Skeleton height={200} borderRadius={12} />
        ) : (
          suggestedProfile.length > 0 && (
            <Card
              title="People you may know"
              action={
                <Link to="/suggestedProfiles" className={styles.seeAll}>
                  See all
                </Link>
              }
            >
              <ul className={styles.suggestions}>
                {suggestedProfile.map((profile) => (
                  <li key={profile.id} className={styles.suggestion}>
                    <Link
                      to={`/profile/${profile.id}`}
                      className={styles.person}
                    >
                      <Avatar
                        src={profile.profilePicUrl}
                        name={profile.fullname}
                        size="lg"
                        alt=""
                      />
                      <span className={styles.name}>{profile.fullname}</span>
                    </Link>
                    <FriendButton profile={profile} fullWidth />
                  </li>
                ))}
              </ul>
            </Card>
          )
        )}
        <PostList query={feed} emptyText="No post at the moment" />
      </div>
    </PageLayout>
  );
}
