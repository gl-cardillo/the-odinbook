import "./about.css";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { MdModeEditOutline, MdOutlineWork, MdSchool } from "react-icons/md";
import { BsGenderAmbiguous } from "react-icons/bs";
import { FaUser, FaBirthdayCake, FaHeart, FaHome } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

export function About({ profile, setRender, render }) {
  const { user, setUser } = useContext(UserContext);
  const [edit, setEdit] = useState(false);

  const schema = yup.object().shape({
    firstname: yup
      .string()
      .min(2)
      .max(20)
      .matches(/^[a-zA-Z0-9]{0,}$/, {
        message: "Special character not allowed.",
      })
      .required("Name is a required field"),
    lastname: yup
      .string()
      .min(2)
      .max(20)
      .matches(/^[a-zA-Z0-9]{0,}$/, {
        message: "Special character not allowed.",
      })
      .required("Last name is a requited field"),
    hometown: yup
      .string()
      .max(30)
      .matches(/^[a-zA-Z0-9]{0,}$/, {
        message: "Special character not allowed.",
      }),
    worksAt: yup.string().max(30),
    school: yup.string().max(30),
    dateOfBirth: yup.date().max(new Date(), "Are you from the future?"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstname: profile.firstname,
      lastname: profile.lastname,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth_formatted,
      hometown: profile.hometown,
      worksAt: profile.worksAt,
      school: profile.school,
      relationship: profile.relationship,
    },
    resolver: yupResolver(schema),
  });

  const updateInfo = (data) => {
    // only way i found to store date of birth witout time in mongodb
    const date = new Date(data.dateOfBirth);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const dateOfBirth = new Date(date.getTime() - userTimezoneOffset);

    axios
      .put(
        `${process.env.REACT_APP_API_URL}/user/updateProfile`,
        {
          id: profile.id,
          firstname: data.firstname,
          lastname: data.lastname,
          gender: data.gender,
          dateOfBirth,
          hometown: data.hometown,
          worksAt: data.worksAt,
          school: data.school,
          relationship: data.relationship,
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
        axios
          .get(`${process.env.REACT_APP_API_URL}/user/profile/${profile.id}`)
          .then((res) => {
            localStorage.setItem("user", JSON.stringify(res.data));
            setUser(res.data);
            setEdit(false);
            setRender(render + 1);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="about-container">
      {profile.id === user.id && (
        <MdModeEditOutline
          onClick={() => setEdit(!edit)}
          className="edit-button"
        />
      )}
      {edit ? (
        <div>
          <form className="about-form" onSubmit={handleSubmit(updateInfo)}>
            <label htmlFor="firstname">
              <h4>First name:</h4>
              <input
                {...register("firstname")}
                type="text"
                id="firtsname"
                label="First Name"
              />
            </label>
            <p className="error-about">{errors?.firstname?.message}</p>
            <label htmlFor="lastname">
              <h4> Last name:</h4>

              <input
                {...register("lastname")}
                type="text"
                id="lastname"
                name="lastname"
              />
            </label>
            <p className="error-about">{errors?.lastname?.message}</p>
            <label htmlFor="dateOfBirth">
              <h4> Date of birth:</h4>
              <input
                {...register("dateOfBirth")}
                type="date"
                name="dateOfBirth"
                id="dateOfBirth"
              />
            </label>
            <p className="error-about">{errors?.dateOfBirth?.message}</p>
            <label htmlFor="hometown">
              <h4> Hometown:</h4>
              <input
                {...register("hometown")}
                type="text"
                name="hometown"
                id="hometown"
              />
            </label>
            <p className="error-about">{errors?.hometown?.message}</p>
            <label htmlFor="worksAt">
              <h4> Works at:</h4>
              <input
                {...register("worksAt")}
                type="text"
                name="worksAt"
                id="worksAt"
              />
            </label>
            <p className="error-about">{errors?.worksAt?.message}</p>
            <label htmlFor="school">
              <h4>Studied at:</h4>
              <input
                {...register("school")}
                type="text"
                name="school"
                id="school"
              />
            </label>
            <p className="error-about">{errors?.school?.message}</p>
            <label htmlFor="gender">
              <h4>Gender:</h4>
              <select
                {...register("gender")}
                id="gender"
                name="gender"
                defaultValue={""}
              >
                <option value="Male"> Male</option>
                <option value="Female"> Female</option>
                <option value="Non-binary"> Non-binary</option>
                <option value=""> Perefer not to say</option>
              </select>
            </label>
            <p className="error-about"></p>
            <label htmlFor="relationship">
              <h4>Relationship:</h4>
              <select
                {...register("relationship")}
                id="relationship"
                name="relationship"
                defaultValue={""}
              >
                <option value="Single">Single</option>
                <option value="In a relationship">In a relationship</option>
                <option value="In an open relationship">
                  In an open relationship
                </option>
                <option value="Married"> Married</option>
                <option value="Divorced"> Divorced</option>
                <option value=""> Perefer not to say</option>
              </select>
            </label>
            <p className="error-about"></p>
            <div className="buttons">
              <button onClick={() => setEdit(false)} type="button">
                Cancel
              </button>{" "}
              <button type="submit">Save</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="about-info">
          <p>
            <FaUser className="about-icon" /> {profile.fullname}
          </p>
          {profile.gender && (
            <p>
              <BsGenderAmbiguous className="about-icon" /> {profile.gender}
            </p>
          )}
          {profile.dateOfBirth && (
            <p>
              <FaBirthdayCake className="about-icon" />{" "}
              {profile.dateOfBirth_formatted}
            </p>
          )}
          {profile.hometown && (
            <p>
              <FaHome className="about-icon" /> {profile.hometown}
            </p>
          )}
          {profile.worksAt && (
            <p>
              <MdOutlineWork className="about-icon" /> {profile.worksAt}
            </p>
          )}
          {profile.school && (
            <p>
              <MdSchool className="about-icon" /> {profile.school}
            </p>
          )}
          {profile.relationship && (
            <p>
              <FaHeart className="about-icon" /> {profile.relationship}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
