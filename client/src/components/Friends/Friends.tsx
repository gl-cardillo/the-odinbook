import { BsPeople } from "react-icons/bs";
import { useCurrentUser } from "../../dataContext/dataContext";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { Card, EmptyState, PeopleGrid, PeopleGridSkeleton } from "../ui";
import { useFriends } from "../../queries";
import type { User } from "../../types";

// the friends of a profile, or your own on the friends page
export function Friends({ profile }: { profile?: User }) {
  const { user } = useCurrentUser();
  const { data: friends } = useFriends(profile ? profile.id : user.id);
  const isMe = !profile || profile.id === user.id;

  const content = (
    <Card title={friends ? `Friends · ${friends.length}` : "Friends"}>
      {!friends ? (
        <PeopleGridSkeleton />
      ) : friends.length > 0 ? (
        <PeopleGrid people={friends} />
      ) : (
        <EmptyState icon={<BsPeople />} title="No friends at the moment">
          {isMe && "Look at the suggestions to find people you may know"}
        </EmptyState>
      )}
    </Card>
  );

  return profile ? (
    content
  ) : (
    <PageLayout title="Friends" aside={<SideMenu />}>
      {content}
    </PageLayout>
  );
}
