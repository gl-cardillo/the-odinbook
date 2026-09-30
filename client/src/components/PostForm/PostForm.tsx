import "./postform.css";
import axios from "axios";
import { useState, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BsX } from "react-icons/bs";
import { RiImageAddLine } from "react-icons/ri";
import { handleError, errorMessage, imageTypes } from "../../utils/utils";
import type { User, SetRender } from "../../types";

interface PostFormProps {
  user: User;
  setRender: SetRender;
  render: number;
}

export function PostForm({ user, setRender, render }: PostFormProps) {
  const imageInput = useRef<HTMLInputElement>(null);
  const [previewPicture, setPreviewPicture] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  const addPost = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (text === "") {
      setError("Text is required");
      return;
    }
    setLoadingPost(true);
    let imageUrl = "";

    try {
      if (file) {
        const url = await axios.get<string>(`/user/generateUrlS3`);

        await axios.put(url.data, file, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: null,
          },
        });
        imageUrl = url.data.split("?")[0];
      }
      await axios.post(`/posts/createPost`, {
        text: text,
        authorId: user._id,
        picUrl: imageUrl,
      });
      setFile(null);
      setPreviewPicture(null);
      setRender(render + 1);
      setLoadingPost(false);
      if (imageInput.current) imageInput.current.value = "";
      setText("");
      setError("");
    } catch (err) {
      console.log(err);
      setLoadingPost(false);
      handleError(errorMessage(err));
    }
  };

  const handlePreview = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const selected = e.target.files?.[0];
    if (!selected) {
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

  const removePic = () => {
    setFile(null);
    setPreviewPicture(null);
    if (imageInput.current) imageInput.current.value = "";
  };

  return (
    <div>
      <form className="add-post" onSubmit={(e) => addPost(e)}>
        <textarea
          rows={4}
          name="text"
          onChange={(e) => setText(e.target.value)}
          value={text}
          placeholder={`What's on your mind, ${user.firstname}?`}
        />
        {error !== "" && text === "" && (
          <p className="error-form-home">{error}</p>
        )}
        {previewPicture && (
          <div className="form-image-container">
            <BsX className="icon-remove-pic" onClick={() => removePic()} />
            {loadingPost && <div className="loader"></div>}
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
              onChange={(e) => handlePreview(e)}
            />
            <RiImageAddLine className="icon-image" />
          </label>
          <button type="submit" disabled={loadingPost}>
            Add Post
          </button>
        </div>
      </form>
    </div>
  );
}
