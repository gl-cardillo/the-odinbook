import "./postform.css";
import axios from "axios";
import { useState, useRef } from "react";
import { BsX } from "react-icons/bs";
import { RiImageAddLine } from "react-icons/ri";

export function PostForm({ user, setRender, render }) {
  const imageInput = useRef(null);
  const [previewPicture, setPreviewPicture] = useState(null);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);

  const addPost = async (e) => {
    setLoadingPost(true);
    e.preventDefault();
    if (text === "") {
      setError("text is required");
      return;
    }
    let imageUrl = "";

    try {
      if (file) {
        const url = await axios.get(
          `${process.env.REACT_APP_API_URL}/user/generateUrlS3`
        );

        await axios.put(url.data, file, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        imageUrl = url.data.split("?")[0];
      }
      await axios.post(`${process.env.REACT_APP_API_URL}/posts/createPost`, {
        text: text,
        authorId: user._id,
        picUrl: imageUrl,
      });
      setFile(null);
      setPreviewPicture(null);
      setRender(render + 1);
      setLoadingPost(false);
      imageInput.current.value = null;
      setText("");
      setError("");
    } catch (error) {
      console.log(error);
    }
  };

  const handlePreview = (e) => {
    e.preventDefault();

    if (
      e.target.files[0].type === "image/bmp" ||
      e.target.files[0].type === "image/gif" ||
      e.target.files[0].type === "image/jpeg" ||
      e.target.files[0].type === "image/png" ||
      e.target.files[0].type === "image/tiff" ||
      e.target.files[0].type === "image/webp"
    ) {
      const reader = new FileReader();

      if (e.target.files.length === 0) {
        return;
      }

      reader.onloadend = (e) => {
        setPreviewPicture(reader.result);
        setError("");
      };

      reader.readAsDataURL(e.target.files[0]);
      setFile(e.target.files[0]);
    } else {
      setError("Insert a vaild image format (bmp, gif, jpeg, png, tiff, webp)");
    }
  };

  const removePic = () => {
    setFile(null);
    setPreviewPicture(null);
    imageInput.current.value = null;
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
