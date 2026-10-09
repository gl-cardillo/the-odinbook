import { useState, useRef, useId } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BsX } from "react-icons/bs";
import { RiImageAddLine } from "react-icons/ri";
import { useCreatePost } from "../../queries";
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_POST_LENGTH,
} from "@odinbook/shared";
import { Avatar, Button, CharCount } from "../ui";
import type { User } from "../../types";
import styles from "./PostForm.module.scss";

export function PostForm({ user }: { user: User }) {
  const imageInput = useRef<HTMLInputElement>(null);
  const [previewPicture, setPreviewPicture] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const createPost = useCreatePost();
  const countId = useId();

  const removePic = () => {
    setFile(null);
    setPreviewPicture(null);
    if (imageInput.current) imageInput.current.value = "";
  };

  const addPost = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (text.trim() === "") {
      setError("Text is required");
      return;
    }
    createPost.mutate(
      { text, file },
      {
        onSuccess: () => {
          removePic();
          setText("");
          setError("");
        },
      }
    );
  };

  const handlePreview = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const selected = e.target.files?.[0];
    if (!selected) {
      return;
    }

    if (selected.size > MAX_IMAGE_BYTES) {
      setError("Images can be at most 5 MB");
      removePic();
      return;
    }

    if (IMAGE_TYPES.includes(selected.type)) {
      const reader = new FileReader();

      reader.onloadend = () => {
        setPreviewPicture(reader.result as string);
        setError("");
      };

      reader.readAsDataURL(selected);
      setFile(selected);
    } else {
      setError("Insert a valid image format (bmp, gif, jpeg, png, tiff, webp)");
    }
  };

  return (
    <form className={styles.card} onSubmit={addPost}>
      <div className={styles.top}>
        <Avatar src={user.profilePicUrl} name={user.fullname} alt="" />
        <textarea
          className={styles.input}
          maxLength={MAX_POST_LENGTH}
          rows={3}
          name="text"
          aria-label="Post text"
          aria-invalid={Boolean(error)}
          aria-describedby={countId}
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          value={text}
          placeholder={`What's on your mind, ${user.firstname}?`}
        />
      </div>
      <CharCount id={countId} length={text.length} max={MAX_POST_LENGTH} />
      {error !== "" && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {previewPicture && (
        <div className={styles.preview}>
          <img src={previewPicture} alt="Picture to post" />
          <button
            type="button"
            className={styles.removePic}
            onClick={removePic}
            disabled={createPost.isPending}
            aria-label="Remove picture"
          >
            <BsX />
          </button>
          {createPost.isPending && <div className={styles.loader} />}
        </div>
      )}
      <div className={styles.buttons}>
        <label className={styles.photo}>
          <input
            type="file"
            accept="image/*"
            ref={imageInput}
            onChange={handlePreview}
          />
          <RiImageAddLine className={styles.photoIcon} />
          Photo
        </label>
        <Button type="submit" disabled={createPost.isPending}>
          Add Post
        </Button>
      </div>
    </form>
  );
}
