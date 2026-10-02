import { useCurrentUser } from "../../dataContext/dataContext";
import { useFriendActions, useFriendRequests } from "../../queries";
import type { User } from "../../types";

// Accept when they asked you, Added when you asked them, Add otherwise
export function FriendButton({ profile }: { profile: User }) {
  const { user } = useCurrentUser();
  const { data: requests } = useFriendRequests();
  const { accept, send } = useFriendActions();

  if (requests?.some((request) => request.id === profile.id)) {
    return (
      <button
        onClick={() => accept.mutate(profile.id)}
        disabled={accept.isPending}
      >
        Accept
      </button>
    );
  }
  if (profile.friendRequests.includes(user.id)) {
    return <button disabled>Added</button>;
  }
  return (
    <button onClick={() => send.mutate(profile.id)} disabled={send.isPending}>
      Add
    </button>
  );
}
