import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export function Login({ setIsAuth }) {
  const navigate = useNavigate();
  const [error, setErrror] = useState("");
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    if (user !== null) {
      setIsAuth(true);
      navigate("/home");
    }
  }, []);

  const schema = yup.object().shape({
    email: yup.string().email().required(),
    password: yup.string().required(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const login = (data) => {
    axios
      .post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email: data.email,
        password: data.password,
      })
      .then((res) => {
        setIsAuth(true);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", JSON.stringify(res.data.token));
        setUser(res.data.user);
        navigate("/home", { replace: true });
      })
      .catch((err) => {
        setErrror(err.response.data.message);
      });
  };

  const loginTestAccount = () => {
    axios
      .post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email: "test-account@example.com",
        password: "",
      })
      .then((res) => {
        setIsAuth(true);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", JSON.stringify(res.data.token));
        setUser(res.data.user);
        navigate("/home", { replace: true });
      })
      .catch((err) => {
        setErrror(err.response.data.message);
      });
  };

  return (
    <div>
      <div className="signlog-section">
        <div>
          <img src={require("../../images/home-pic.png")} alt="logo" />
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
                name="email"
                {...register("email")}
                className={errors?.email?.message && "error-input"}
              />
            </div>
            <p className="error-form">{errors?.email?.message}</p>
            <div className="label-input">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
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
