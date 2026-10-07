import { Link } from "react-router";
import Skeleton from "react-loading-skeleton";
import { useCurrentUser } from "../../dataContext/dataContext";
import { useFriendActions, useFriendRequests, useFriends } from "../../queries";
import { Button, Card, PersonRow } from "../ui";
import styles from "./SideMenu.module.scss";

export function SideMenu() {
  const { user } = useCurrentUser();
  const { data: requests } = useFriendRequests(3);
  const { data: friends } = useFriends(user.id, 3);
  const { accept } = useFriendActions();

  return (
    <div className={styles.side}>
      <Card className={styles.me}>
        <PersonRow person={user} subtitle="See your profile" size="lg" />
      </Card>

      <Card
        title="Friend requests"
        action={
          <Link to="/friendRequests" className={styles.seeAll}>
            See all
          </Link>
        }
      >
        {!requests ? (
          <Skeleton height={40} count={2} style={{ marginBottom: 8 }} />
        ) : requests.length === 0 ? (
          <p className={styles.empty}>No requests at the moment</p>
        ) : (
          <div className={styles.list}>
            {requests.map((request) => (
              <PersonRow
                key={request.id}
                person={request}
                action={
                  <Button
                    size="sm"
                    onClick={() => accept.mutate(request.id)}
                    disabled={accept.isPending}
                  >
                    Accept
                  </Button>
                }
              />
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Friends"
        action={
          <Link to="/friends" className={styles.seeAll}>
            See all
          </Link>
        }
      >
        {!friends ? (
          <Skeleton height={40} count={2} style={{ marginBottom: 8 }} />
        ) : friends.length === 0 ? (
          <p className={styles.empty}>No friends yet</p>
        ) : (
          <div className={styles.list}>
            {friends.map((friend) => (
              <PersonRow key={friend.id} person={friend} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
