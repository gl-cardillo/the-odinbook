import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { useNavigate, Link } from "react-router";
import homePic from "../../images/home-pic.png";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { errorMessage } from "../../utils/utils";
import { api } from "../../api";

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().required(),
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
    formState: { errors },
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
    <div>
      <div className="signlog-section">
        <div>
          <img src={homePic} alt="logo" />
          <h1>Odinbook</h1>
          <h2 className="text1024px">
            Connect with friends and the world around you on Odinbook.
          </h2>
        </div>
        <div>
          <form onSubmit={handleSubmit(login)} className="signlog-form">
            <h2 className="text-signlog-form">Login</h2>
            <div className="label-input">
              <p className="login-error">{error}</p>
              <label htmlFor="username">Email</label>
              <input
                type="email"
                {...register("email")}
                className={errors?.email?.message && "error-input"}
              />
            </div>
            <p className="error-form">{errors?.email?.message}</p>
            <div className="label-input">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                {...register("password")}
                className={errors?.password?.message && "error-input"}
              />
            </div>
            <p className="error-form">{errors?.password?.message} </p>
            <button className="signlog-button" type="submit">
              Login
            </button>
            <Link to={"/signin"}>
              <button className="signlog-button new-account">
                Create new account
              </button>
            </Link>
            <button
              type="button"
              className="signlog-button  test-account"
              onClick={() => loginTestAccount()}
            >
              Login without an account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
