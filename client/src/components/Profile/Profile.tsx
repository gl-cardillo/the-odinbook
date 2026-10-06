import { useState } from "react";
import type { ChangeEvent } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { useParams } from "react-router";
import { PostForm } from "../PostForm/PostForm";
import { PostList } from "../PostList/PostList";
import { Friends } from "../Friends/Friends";
import { About } from "../About/About";
import { SideMenu } from "../SideMenu/SideMenu";
import { PageLayout } from "../PageLayout/PageLayout";
import { Alert, Avatar, Button } from "../ui";
import { MdPhotoCamera } from "react-icons/md";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from "@odinbook/shared";
import {
  useChangePicture,
  useFriendActions,
  useUser,
  useUserPosts,
} from "../../queries";
import type { User } from "../../types";
import styles from "./Profile.module.scss";

const sections = ["posts", "friends", "about"] as const;
type Section = (typeof sections)[number];

// add, cancel or remove the friendship with the profile you are looking at
function FriendshipButton({ profile, me }: { profile: User; me: User }) {
  const { send, cancel, remove } = useFriendActions();

  if (profile.friends.includes(me.id)) {
    return (
      <Button
        variant="secondary"
        onClick={() => remove.mutate(profile.id)}
        disabled={remove.isPending}
      >
        Remove friend
      </Button>
    );
  }
  if (profile.friendRequests.includes(me.id)) {
    return (
      <Button
        variant="secondary"
        onClick={() => cancel.mutate(profile.id)}
        disabled={cancel.isPending}
      >
        Remove friend request
      </Button>
    );
  }
  return (
    <Button onClick={() => send.mutate(profile.id)} disabled={send.isPending}>
      Add friend
    </Button>
  );
}

interface PictureInputProps {
  label: string;
  className: string;
  disabled: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  text?: string;
}

// a camera button that opens the file picker
function PictureInput({
  label,
  className,
  disabled,
  onChange,
  text,
}: PictureInputProps) {
  return (
    <label
      className={`${styles.pictureButton} ${className}`}
      aria-disabled={disabled}
      title={label}
    >
      <input
        type="file"
        accept="image/*"
        aria-label={label}
        disabled={disabled}
        onChange={onChange}
      />
      <MdPhotoCamera aria-hidden />
      {text && <span className={styles.pictureText}>{text}</span>}
    </label>
  );
}

export function Profile() {
  const { profileId = "" } = useParams();
  const { user, updateUser } = useCurrentUser();
  const [section, setSection] = useState<Section>("posts");
  const [error, setError] = useState("");

  const { data: profile } = useUser(profileId);
  const posts = useUserPosts(profileId);
  const changePicture = useChangePicture(updateUser);
  const isMe = profileId === user.id;

  const onPicture =
    (kind: "profile" | "cover") => (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!IMAGE_TYPES.includes(file.type)) {
        setError(
          "Insert a valid image format (bmp, gif, jpeg, png, tiff, webp)"
        );
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError("Images can be at most 5 MB");
        return;
      }
      setError("");
      changePicture.mutate({ kind, file });
    };

  const friendsCount = profile?.friends.length ?? 0;

  return (
    <PageLayout aside={<SideMenu />}>
      <div className={styles.page}>
        {profile ? (
          <section className={styles.header}>
            <div className={styles.cover}>
              <img src={profile.coverPicUrl} alt="" />
              {isMe && (
                <PictureInput
                  label="Change cover picture"
                  text="Edit cover"
                  className={styles.coverButton}
                  disabled={changePicture.isPending}
                  onChange={onPicture("cover")}
                />
              )}
            </div>
            <div className={styles.identity}>
              <div className={styles.avatar}>
                <Avatar
                  src={profile.profilePicUrl}
                  name={profile.fullname}
                  size="xl"
                  alt=""
                />
                {isMe && (
                  <PictureInput
                    label="Change profile picture"
                    className={styles.avatarButton}
                    disabled={changePicture.isPending}
                    onChange={onPicture("profile")}
                  />
                )}
              </div>
              <div className={styles.nameBlock}>
                <h1 className={styles.name} data-cy="profile-name">
                  {profile.fullname}
                </h1>
                <p className={styles.friendsCount}>
                  {friendsCount === 1 ? "1 friend" : `${friendsCount} friends`}
                </p>
              </div>
              {!isMe && (
                <div className={styles.actions}>
                  <FriendshipButton profile={profile} me={user} />
                </div>
              )}
            </div>
            {(error || changePicture.isError || changePicture.isPending) && (
              <div className={styles.status}>
                {changePicture.isPending ? (
                  <p className={styles.uploading}>Uploading picture...</p>
                ) : (
                  <Alert>
                    {error || "The picture could not be changed, try again"}
                  </Alert>
                )}
              </div>
            )}
            <nav className={styles.tabs} aria-label="Profile sections">
              {sections.map((name) => (
                <button
                  key={name}
                  className={`${styles.tab} ${section === name ? styles.active : ""}`}
                  onClick={() => setSection(name)}
                  aria-current={section === name ? "page" : undefined}
                >
                  {name[0].toUpperCase() + name.slice(1)}
                </button>
              ))}
            </nav>
          </section>
        ) : (
          <Skeleton height={420} borderRadius={12} />
        )}
        {section === "about" && profile && <About profile={profile} />}
        {section === "friends" && profile && <Friends profile={profile} />}
        {section === "posts" && (
          <>
            {isMe && <PostForm user={user} />}
            <PostList query={posts} emptyText="No post available" />
          </>
        )}
      </div>
    </PageLayout>
  );
}
