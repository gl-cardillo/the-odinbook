import { useCurrentUser } from "../../dataContext/dataContext";
import { Link } from "react-router";
import { PostForm } from "../PostForm/PostForm";
import { PostList } from "../PostList/PostList";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { FriendButton } from "../FriendButton/FriendButton";
import { Card, PeopleGrid } from "../ui";
import Skeleton from "react-loading-skeleton";
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
              <PeopleGrid
                people={suggestedProfile}
                action={(profile) => (
                  <FriendButton profile={profile} fullWidth />
                )}
              />
            </Card>
          )
        )}
        <PostList query={feed} emptyText="No post at the moment" />
      </div>
    </PageLayout>
  );
}
