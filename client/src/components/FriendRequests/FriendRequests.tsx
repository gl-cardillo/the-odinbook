import Skeleton from "react-loading-skeleton";
import { BsPersonPlus } from "react-icons/bs";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { Button, Card, EmptyState, PersonRow } from "../ui";
import { useFriendActions, useFriendRequests } from "../../queries";
import styles from "./FriendRequests.module.scss";

export function FriendRequests() {
  const { data: requests } = useFriendRequests();
  const { accept, decline } = useFriendActions();
  const busy = accept.isPending || decline.isPending;

  return (
    <PageLayout aside={<SideMenu />}>
      <Card title="Friend requests">
        {!requests ? (
          <Skeleton height={56} count={3} style={{ marginBottom: 8 }} />
        ) : requests.length > 0 ? (
          <ul className={styles.list}>
            {requests.map((request) => (
              <li key={request.id} className={styles.request} data-cy="request">
                <PersonRow
                  person={request}
                  size="lg"
                  subtitle="Wants to be your friend"
                />
                <div className={styles.buttons}>
                  <Button
                    size="sm"
                    onClick={() => accept.mutate(request.id)}
                    disabled={busy}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => decline.mutate(request.id)}
                    disabled={busy}
                  >
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<BsPersonPlus />}
            title="No friend requests at the moment"
          >
            When someone asks to be your friend, you will find them here
          </EmptyState>
        )}
      </Card>
    </PageLayout>
  );
}
