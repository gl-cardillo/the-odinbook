import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { FaSignOutAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useCurrentUser } from "../../dataContext/dataContext";
import { useDeleteAccount } from "../../queries";
import { confirmDelete } from "../../utils/utils";
import { Avatar, useDismiss } from "../ui";
import styles from "./Navbar.module.scss";

const GUEST_EMAIL = "test-account@example.com";

export function AccountMenu() {
  const navigate = useNavigate();
  const { user, logout } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  const deleteAccount = useDeleteAccount();
  const isGuest = user.email === GUEST_EMAIL;

  const logoutUser = () => {
    navigate("/");
    logout();
  };

  const onDeleteAccount = async () => {
    setOpen(false);
    const confirmed = await confirmDelete(
      "Are you sure you want to delete your account? Your posts, comments and friends will be deleted too."
    );
    if (!confirmed) return;
    deleteAccount.mutate(undefined, { onSuccess: logoutUser });
  };

  return (
    <div className={styles.menu} ref={ref}>
      <button
        className={styles.avatarButton}
        onClick={() => setOpen(!open)}
        aria-label="Account menu"
        aria-expanded={open}
        data-cy="account-menu"
      >
        <Avatar
          src={user.profilePicUrl}
          name={user.fullname}
          size="sm"
          alt=""
        />
      </button>

      {open && (
        <div className={`${styles.panel} ${styles.alignEnd} ${styles.narrow}`}>
          <Link
            to={`/profile/${user.id}`}
            className={styles.profileLink}
            onClick={() => setOpen(false)}
          >
            <Avatar src={user.profilePicUrl} name={user.fullname} alt="" />
            <span>
              <strong>{user.fullname}</strong>
              <span className={styles.secondaryText}>See your profile</span>
            </span>
          </Link>
          <hr className={styles.separator} />
          <button className={styles.menuItem} onClick={logoutUser}>
            <FaSignOutAlt aria-hidden="true" /> Log out
          </button>
          {!isGuest && (
            <button
              className={`${styles.menuItem} ${styles.danger}`}
              onClick={onDeleteAccount}
            >
              <MdDelete aria-hidden="true" /> Delete account
            </button>
          )}
        </div>
      )}
    </div>
  );
}
