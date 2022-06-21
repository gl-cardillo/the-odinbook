import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export function PostForm({ user, setRender, render }) {
  const addPost = (data) => {
    axios
      .post(
        "/posts/createPost",
        {
          text: data.text,
          userId: user._id,
          userFullname: user.fullname,
        },
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        }
      )
      .then(() => {
        setRender((render) => render + 1);
        reset();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const schema = yup.object().shape({
    text: yup.string().required("Text in the post are required "),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  return (
    <div>
      <form className="add-post" onSubmit={handleSubmit(addPost)}>
        <textarea
          rows={5}
          name="text"
          {...register("text")}
          placeholder={`What's on your mind, ${user.firstname}?`}
        />
        <p className="error-form-home">{errors?.text?.message}</p>
        <button type="submit">Add Post</button>
      </form>
    </div>
  );
}
