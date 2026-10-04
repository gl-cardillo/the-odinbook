import { useState, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { errorMessage } from "../../utils/utils";
import { api } from "../../api";
import { AuthLayout, Field } from "../AuthLayout/AuthLayout";
import { inputProps } from "../AuthLayout/inputProps";
import styles from "../AuthLayout/AuthLayout.module.scss";

const name = (label: string) =>
  yup
    .string()
    .required(`${label} is required`)
    .min(2, `${label} must be at least 2 characters`)
    .max(15, `${label} can be at most 15 characters`)
    .matches(/^[a-zA-Z0-9]*$/, "Only letters and numbers");

const schema = yup.object().shape({
  firstname: name("First name"),
  lastname: name("Last name"),
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(15, "Password can be at most 15 characters")
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?])[A-Za-z\d@$!%*#?]{8,}$/,
      "Use at least one letter, one number and one of @$!%*#?"
    ),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords should match"),
});

type SigninForm = yup.InferType<typeof schema>;

export function Signin() {
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const { login } = useContext(UserContext);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SigninForm>({
    resolver: yupResolver(schema),
  });

  const signin = async (data: SigninForm) => {
    try {
      const { user, token } = await api.signup({
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        password: data.password,
      });
      login(user, token);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(errorMessage(err) ?? "");
    }
  };

  return (
    <AuthLayout>
      <h2 className={styles.heading}>Create a new account</h2>
      <p className={styles.subheading}>It's quick and easy.</p>
      <form onSubmit={handleSubmit(signin)} className={styles.form} noValidate>
        {error && (
          <p className={styles.alert} role="alert">
            {error}
          </p>
        )}
        <div className={styles.row}>
          <Field
            id="firstname"
            label="First name"
            error={errors.firstname?.message}
          >
            <input
              type="text"
              autoComplete="given-name"
              {...inputProps("firstname", errors.firstname?.message)}
              {...register("firstname")}
            />
          </Field>
          <Field
            id="lastname"
            label="Last name"
            error={errors.lastname?.message}
          >
            <input
              type="text"
              autoComplete="family-name"
              {...inputProps("lastname", errors.lastname?.message)}
              {...register("lastname")}
            />
          </Field>
        </div>
        <Field id="email" label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            {...inputProps("email", errors.email?.message)}
            {...register("email")}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="new-password"
            {...inputProps("password", errors.password?.message)}
            {...register("password")}
          />
        </Field>
        <Field
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...inputProps("confirmPassword", errors.confirmPassword?.message)}
            {...register("confirmPassword")}
          />
        </Field>
        <button
          className={`${styles.button} ${styles.success}`}
          type="submit"
          disabled={isSubmitting}
        >
          Sign up
        </button>
      </form>
      <p className={styles.footer}>
        Already have an account? <Link to="/">Log in</Link>
      </p>
    </AuthLayout>
  );
}
