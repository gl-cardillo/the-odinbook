import { useCurrentUser } from "../../dataContext/dataContext";
import { useFriendActions, useFriendRequests } from "../../queries";
import { Button } from "../ui";
import type { User } from "../../types";

interface FriendButtonProps {
  profile: User;
  fullWidth?: boolean;
}

// Accept when they asked you, Added when you asked them, Add otherwise
export function FriendButton({ profile, fullWidth }: FriendButtonProps) {
  const { user } = useCurrentUser();
  const { data: requests } = useFriendRequests();
  const { accept, send } = useFriendActions();
  const look = { size: "sm", fullWidth } as const;

  if (requests?.some((request) => request.id === profile.id)) {
    return (
      <Button
        {...look}
        variant="success"
        onClick={() => accept.mutate(profile.id)}
        disabled={accept.isPending}
      >
        Accept
      </Button>
    );
  }
  if (profile.friendRequests.includes(user.id)) {
    return (
      <Button {...look} variant="secondary" disabled>
        Added
      </Button>
    );
  }
  return (
    <Button
      {...look}
      onClick={() => send.mutate(profile.id)}
      disabled={send.isPending}
    >
      Add
    </Button>
  );
}
