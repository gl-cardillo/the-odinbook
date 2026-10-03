import "./postform.css";
import { useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BsX } from "react-icons/bs";
import { RiImageAddLine } from "react-icons/ri";
import { imageTypes } from "../../utils/utils";
import { useCreatePost } from "../../queries";
import { MAX_IMAGE_BYTES, MAX_POST_LENGTH } from "../../api";
import type { User } from "../../types";

export function PostForm({ user }: { user: User }) {
  const imageInput = useRef<HTMLInputElement>(null);
  const [previewPicture, setPreviewPicture] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const createPost = useCreatePost();

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

    if (imageTypes.includes(selected.type)) {
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
    <div>
      <form className="add-post" onSubmit={addPost}>
        <textarea
          maxLength={MAX_POST_LENGTH}
          rows={4}
          name="text"
          onChange={(e) => {
            setText(e.target.value);
            setError("");
          }}
          value={text}
          placeholder={`What's on your mind, ${user.firstname}?`}
        />
        {error !== "" && <p className="error-form-home">{error}</p>}
        {previewPicture && (
          <div className="form-image-container">
            <BsX className="icon-remove-pic" onClick={removePic} />
            {createPost.isPending && <div className="loader"></div>}
            <img src={previewPicture} alt="insert picture" />
          </div>
        )}
        <div className="post-form-buttons">
          <label htmlFor="file-input">
            <input
              type="file"
              id="file-input"
              accept="image/*"
              ref={imageInput}
              onChange={handlePreview}
            />
            <RiImageAddLine className="icon-image" />
          </label>
          <button type="submit" disabled={createPost.isPending}>
            Add Post
          </button>
        </div>
      </form>
    </div>
  );
}
