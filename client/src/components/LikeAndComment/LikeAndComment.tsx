import "./likeAndComment.css";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { FaRegComment, FaComment } from "react-icons/fa";
import { BsX } from "react-icons/bs";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { useForm } from "react-hook-form";
import { Comment } from "../Comment/Comment";
import { nFormatter } from "../../utils/utils";
import { useCommentActions, useComments, useLikePost } from "../../queries";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { MAX_COMMENT_LENGTH } from "@odinbook/shared";
import type { Post, UserSummary } from "../../types";

const schema = yup.object().shape({
  text: yup
    .string()
    .trim()
    .required("Text in the post are required ")
    .max(
      MAX_COMMENT_LENGTH,
      `Comments can be at most ${MAX_COMMENT_LENGTH} characters`
    ),
});

type CommentForm = yup.InferType<typeof schema>;

export function LikeAndComment({ post }: { post: Post }) {
  const [expandComments, setExpandComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  // likes come with the post, a like answers with the new list
  const [likes, setLikes] = useState<UserSummary[]>(post.likedBy);
  const { user } = useCurrentUser();

  const { data: comments } = useComments(post.id, expandComments);
  const { create } = useCommentActions(post.id);
  const likePost = useLikePost(post.id);
  const commentsCount = comments?.length ?? post.commentsCount;
  const liked = likes.some((profile) => profile.id === user.id);

  useEffect(() => {
    setLikes(post.likedBy);
  }, [post.likedBy]);

  const toggleLike = () =>
    likePost.mutate(!liked, { onSuccess: (newLikes) => setLikes(newLikes) });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CommentForm>({
    resolver: yupResolver(schema),
  });

  const addComment = (data: CommentForm) =>
    create.mutate(data.text, { onSuccess: () => reset() });

  return (
    <div>
      <div className="like-comments-container">
        <div className="likes-count-container">
          {likes.length > 0 && (
            <p onClick={() => setShowLikes(true)} className="like-count">
              <AiFillLike className="like-comment" /> {likes[0].fullname}
              {
                // with more than one like show the first name and how many others
                likes.length > 1 &&
                  ` and an other ${nFormatter(likes.length - 1)}`
              }
            </p>
          )}
          {showLikes && (
            // a screen with all the users who liked the post
            <div className="black-screen">
              <div className="screen-container">
                <div className="title-button">
                  <h4>Post liked by</h4>
                  <BsX
                    className="delete-button"
                    onClick={() => setShowLikes(false)}
                  />
                </div>
                {likes.map((liker) => (
                  <div key={liker.id} className="likes">
                    <img
                      src={liker.profilePicUrl}
                      className="avatar-pic"
                      alt="avatar"
                    />
                    <p>{liker.fullname}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="comments-count-contaienr">
          {commentsCount > 0 && (
            <p
              className="comment-count"
              onClick={() => setExpandComments(!expandComments)}
            >
              {commentsCount > 1
                ? `${nFormatter(commentsCount)} comments`
                : "1 comment"}
            </p>
          )}
        </div>
      </div>
      <div className="post-buttons">
        <button onClick={toggleLike} disabled={likePost.isPending}>
          {liked ? <AiFillLike className="blue" /> : <AiOutlineLike />}
          Like
        </button>

        <button onClick={() => setExpandComments(!expandComments)}>
          {expandComments ? <FaComment className="blue" /> : <FaRegComment />}
          Comment
        </button>
      </div>
      {expandComments && (
        <div>
          {comments ? (
            comments.map((comment) => (
              <Comment key={comment.id} comment={comment} postId={post.id} />
            ))
          ) : (
            <Skeleton
              height={80}
              style={{ margin: "10px 0" }}
              count={Math.min(commentsCount, 3) || 1}
            />
          )}
          <form className="add-comment" onSubmit={handleSubmit(addComment)}>
            <textarea
              maxLength={MAX_COMMENT_LENGTH}
              rows={5}
              {...register("text")}
              placeholder="Write a comment..."
            />
            <p className="error-form-comment">{errors?.text?.message}</p>
            <button type="submit" disabled={create.isPending}>
              Add Comment
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
