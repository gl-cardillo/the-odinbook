import { Link, NavLink, Outlet } from "react-router";
import { IoHomeSharp, IoPeopleOutline } from "react-icons/io5";
import { FiUserPlus, FiUsers } from "react-icons/fi";
import { useFriendRequests } from "../../queries";
import { SearchBox } from "./SearchBox";
import { NotificationsMenu } from "./NotificationsMenu";
import { AccountMenu } from "./AccountMenu";
import styles from "./Navbar.module.scss";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.tab} ${styles.active}` : styles.tab;

export function Navbar() {
  const { data: friendRequests = [] } = useFriendRequests();

  return (
    <>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.bar}>
          <div className={styles.start}>
            <Link to="/home" className={styles.logo} aria-label="Odinbook home">
              <span className={styles.logoFull}>Odinbook</span>
              <span className={styles.logoShort} aria-hidden="true">
                o
              </span>
            </Link>
            <SearchBox />
          </div>

          <nav className={styles.tabs} aria-label="Main">
            <NavLink to="/home" className={tabClass} title="Home">
              <IoHomeSharp />
              <span className={styles.srOnly}>Home</span>
            </NavLink>
            <NavLink to="/friends" className={tabClass} title="Friends">
              <FiUsers />
              <span className={styles.srOnly}>Friends</span>
            </NavLink>
            <NavLink
              to="/friendRequests"
              className={tabClass}
              title="Friend requests"
            >
              <FiUserPlus />
              <span className={styles.srOnly}>Friend requests</span>
              {friendRequests.length > 0 && (
                <span className={styles.badge} data-cy="requests-badge">
                  {friendRequests.length > 9 ? "9+" : friendRequests.length}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/suggestedProfiles"
              className={tabClass}
              title="People you may know"
            >
              <IoPeopleOutline />
              <span className={styles.srOnly}>People you may know</span>
            </NavLink>
          </nav>

          <div className={styles.end}>
            <NotificationsMenu />
            <AccountMenu />
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
}
