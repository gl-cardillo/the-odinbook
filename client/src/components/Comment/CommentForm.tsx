import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { MAX_COMMENT_LENGTH } from "@odinbook/shared";
import { Avatar, Button, CharCount } from "../ui";
import { useCurrentUser } from "../../dataContext/dataContext";
import styles from "./Comment.module.scss";

const schema = yup.object().shape({
  text: yup
    .string()
    .trim()
    .required("Write something first")
    .max(
      MAX_COMMENT_LENGTH,
      `Comments can be at most ${MAX_COMMENT_LENGTH} characters`
    ),
});

type Form = yup.InferType<typeof schema>;

interface CommentFormProps {
  placeholder: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (text: string, done: () => void) => void;
}

// used for comments and replies
export function CommentForm({
  placeholder,
  submitLabel,
  pending,
  onSubmit,
}: CommentFormProps) {
  const { user } = useCurrentUser();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<Form>({ resolver: yupResolver(schema) });
  const length = useWatch({ control, name: "text" })?.length ?? 0;
  const countId = useId();

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit((data) => onSubmit(data.text, () => reset()))}
    >
      <Avatar src={user.profilePicUrl} name={user.fullname} size="sm" alt="" />
      <div className={styles.formBody}>
        <textarea
          className={styles.input}
          maxLength={MAX_COMMENT_LENGTH}
          rows={2}
          aria-label={placeholder}
          aria-invalid={Boolean(errors.text)}
          aria-describedby={countId}
          {...register("text")}
          placeholder={placeholder}
        />
        {errors.text && <p className={styles.error}>{errors.text.message}</p>}
        <CharCount id={countId} length={length} max={MAX_COMMENT_LENGTH} />
        <Button type="submit" size="sm" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
