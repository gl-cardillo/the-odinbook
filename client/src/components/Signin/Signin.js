import "./signin.css";
import axios from "axios";
import { useState, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export function Signin({ setIsAuth }) {
  let navigate = useNavigate();

  const [error, setErrror] = useState("");
  const { setUser } = useContext(UserContext);

  const schema = yup.object().shape({
    firstname: yup
      .string()
      .min(2)
      .max(15)
      .matches(/^[a-zA-Z0-9]{0,}$/, {
        message: "Special character not allowed.",
      })
      .required("Name is a required field"),
    lastname: yup
      .string()
      .min(2)
      .max(15)
      .matches(/^[a-zA-Z0-9]{0,}$/, {
        message: "Special character not allowed.",
      })
      .required("Last name is a requited field"),
    email: yup.string().email().required(),
    password: yup
      .string()
      .min(8)
      .max(15)
      .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?])[A-Za-z\d@$!%*#?]{8,}$/, {
        message:
          "Password must be  eight characters, at least one letter, one number and one special character(@$!%*#?)",
      })
      .required(),
    confirmPassword: yup.string().oneOf([yup.ref("password"), null]),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const signin = (data) => {
    axios
      .post(`${process.env.REACT_APP_API_URL}/auth/signin`, {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        password: data.password,
      })
      .then((res) => {
        setIsAuth(true);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", JSON.stringify(res.data.token));
        axios.defaults.headers.Authorization = `Bearer ${res.data.token}`;
        setUser(res.data.user);
        navigate("/home", { replace: true });
      })
      .catch((err) => {
        console.log(err);
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
          <form onSubmit={handleSubmit(signin)} className="signlog-form ">
            <h2 className="text-signlog-form">Sign up, It's quick and easy.</h2>
            <div className="label-input">
              <label htmlFor="firstname">First name</label>
              <input
                className={errors?.firstname?.message ? "error-input" : ""}
                type="text"
                name="firstname"
                {...register("firstname")}
              />
            </div>
            <p className="error-form">{errors?.firstname?.message}</p>
            <div className="label-input">
              <label htmlFor="email">Last name</label>
              <input
                className={errors?.lastname?.message ? "error-input" : ""}
                type="text"
                name="lastname"
                {...register("lastname")}
              />
            </div>
            <p className="error-form">{errors.lastname?.message}</p>
            <div className="label-input">
              <label htmlFor="email">Email</label>
              <input
                className={errors?.email?.message ? "error-input" : ""}
                type="email"
                name="email"
                {...register("email")}
              />
            </div>
            <p className="error-form">{errors?.email?.message}</p>
            <div className="label-input">
              <label htmlFor="password">Password</label>
              <input
                className={errors?.password?.message ? "error-input" : ""}
                type="password"
                name="password"
                {...register("password")}
              />
            </div>
            <p className="error-form">{errors?.password?.message}</p>
            <div className="label-input">
              <label htmlFor="password">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                {...register("confirmPassword")}
                className={
                  errors?.confirmPassword?.message ? "error-input" : ""
                }
              />
            </div>
            <p className="error-form">
              {errors?.confirmPassword && "Passwords should match"}
            </p>
            <button className="signlog-button" type="submit">
              Sign in
            </button>{" "}
            <p className="error-form">{error !== "" ? error : ""}</p>
          </form>
          <Link to={"/"}>
            <p>
              Already have an account? click <span className="blue">here</span>
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
