import { BsPeople } from "react-icons/bs";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { FriendButton } from "../FriendButton/FriendButton";
import { Card, EmptyState, PeopleGrid, PeopleGridSkeleton } from "../ui";
import { useSuggestions } from "../../queries";

// profiles that are not friend with the user
export function SuggestedProfile() {
  const { data: suggestedProfile } = useSuggestions();

  return (
    <PageLayout title="People you may know" aside={<SideMenu />}>
      <Card title="People you may know">
        {!suggestedProfile ? (
          <PeopleGridSkeleton count={6} />
        ) : suggestedProfile.length > 0 ? (
          <PeopleGrid
            people={suggestedProfile}
            action={(profile) => <FriendButton profile={profile} fullWidth />}
          />
        ) : (
          <EmptyState
            icon={<BsPeople />}
            title="No profiles available at the moment"
          >
            You already know everyone here
          </EmptyState>
        )}
      </Card>
    </PageLayout>
  );
}
