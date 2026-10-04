import "./profile.css";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { useParams } from "react-router";
import { PostForm } from "../PostForm/PostForm";
import { PostList } from "../PostList/PostList";
import { Friends } from "../Friends/Friends";
import { About } from "../About/About";
import { SideMenu } from "../SideMenu/SideMenu";
import { TiPlusOutline } from "react-icons/ti";
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

type Section = "posts" | "friends" | "about";

// add, cancel or remove the friendship with the profile you are looking at
function FriendshipButton({ profile, me }: { profile: User; me: User }) {
  const { send, cancel, remove } = useFriendActions();

  if (profile.friends.includes(me.id)) {
    return (
      <button
        className="remove-button"
        onClick={() => remove.mutate(profile.id)}
        disabled={remove.isPending}
      >
        Remove friend
      </button>
    );
  }
  if (profile.friendRequests.includes(me.id)) {
    return (
      <button
        className="remove-button"
        onClick={() => cancel.mutate(profile.id)}
        disabled={cancel.isPending}
      >
        Remove friend request
      </button>
    );
  }
  return (
    <button
      className="add-button"
      onClick={() => send.mutate(profile.id)}
      disabled={send.isPending}
    >
      Add friend
    </button>
  );
}

export function Profile() {
  const { profileId = "" } = useParams();
  const { user, updateUser } = useCurrentUser();
  const [section, setSection] = useState<Section>("posts");

  const { data: profile } = useUser(profileId);
  const posts = useUserPosts(profileId);
  const changePicture = useChangePicture(updateUser);
  const isMe = profileId === user.id;

  const onPicture =
    (kind: "profile" | "cover") => (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!IMAGE_TYPES.includes(file.type)) {
        alert("Insert a valid image format (bmp, gif, jpeg, png, tiff, webp)");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        alert("Images can be at most 5 MB");
        return;
      }
      changePicture.mutate({ kind, file });
    };

  return (
    <div className="main-page">
      <div className="containers">
        {profile ? (
          <div className="profile-info-container">
            <div className="cover-container">
              <label htmlFor="cover-pic">
                <img
                  className="profile-cover"
                  src={profile.coverPicUrl}
                  alt="cover picture"
                />
                {isMe && (
                  <div className="overlay">
                    <TiPlusOutline className="pic-icon cover" />
                    <input
                      type="file"
                      id="cover-pic"
                      accept="image/*"
                      onChange={onPicture("cover")}
                    />
                  </div>
                )}
              </label>
            </div>
            <div className="profile-pic-container">
              <label htmlFor="profile-pic">
                <img src={profile.profilePicUrl} alt="avatar" />
                {isMe && (
                  <div className="overlay">
                    <TiPlusOutline className="pic-icon" />
                    <input
                      type="file"
                      id="profile-pic"
                      accept="image/*"
                      onChange={onPicture("profile")}
                    />
                  </div>
                )}
              </label>
            </div>
            <div className="profile-name-button">
              <p className="profile-username">{profile.fullname}</p>
              {!isMe && <FriendshipButton profile={profile} me={user} />}
            </div>
            <div className="profile-section">
              {(["posts", "friends", "about"] as const).map((name) => (
                <button
                  key={name}
                  className={section === name ? "active-section" : ""}
                  onClick={() => setSection(name)}
                >
                  {name[0].toUpperCase() + name.slice(1)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Skeleton height={500} />
        )}
        {section === "about" && profile && (
          <div className="profile-about-section">
            <About profile={profile} />
          </div>
        )}
        {section === "friends" && profile && (
          <div className="profile-friends-section">
            <Friends profile={profile} />
          </div>
        )}
        {section === "posts" && (
          <div className="profile-post-section">
            {isMe && <PostForm user={user} />}
            <PostList query={posts} emptyText="No post available" />
          </div>
        )}
      </div>
      <SideMenu />
    </div>
  );
}
