import { Modal, PersonRow } from "../ui";
import type { UserSummary } from "../../types";

interface LikesModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  likes: UserSummary[];
}

export function LikesModal({ open, onClose, title, likes }: LikesModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {likes.map((liker) => (
        <PersonRow key={liker.id} person={liker} />
      ))}
    </Modal>
  );
}
