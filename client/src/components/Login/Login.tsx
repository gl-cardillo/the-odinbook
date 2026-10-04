import { useState, useEffect, useContext } from "react";
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

const schema = yup.object().shape({
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: yup.string().required("Password is required"),
});

type LoginForm = yup.InferType<typeof schema>;

export function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const { user, login: startSession } = useContext(UserContext);

  useEffect(() => {
    if (user !== null) {
      navigate("/home");
    }
  }, [navigate, user]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: yupResolver(schema),
  });

  const login = async (data: { email: string; password: string }) => {
    try {
      const { user, token } = await api.login(data.email, data.password);
      startSession(user, token);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(errorMessage(err) ?? "");
    }
  };

  const loginTestAccount = () => {
    login({ email: "test-account@example.com", password: "" });
  };

  return (
    <AuthLayout>
      <h2 className={styles.heading}>Log in</h2>
      <p className={styles.subheading}>Welcome back! Good to see you.</p>
      <form onSubmit={handleSubmit(login)} className={styles.form} noValidate>
        {error && (
          <p className={styles.alert} role="alert">
            {error}
          </p>
        )}
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
            autoComplete="current-password"
            {...inputProps("password", errors.password?.message)}
            {...register("password")}
          />
        </Field>
        <button
          className={`${styles.button} ${styles.primary}`}
          type="submit"
          disabled={isSubmitting}
        >
          Log in
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.outline}`}
          onClick={loginTestAccount}
          disabled={isSubmitting}
        >
          Try it without an account
        </button>
        <div className={styles.divider} />
        <Link to="/signin" className={`${styles.button} ${styles.success}`}>
          Create new account
        </Link>
      </form>
    </AuthLayout>
  );
}
