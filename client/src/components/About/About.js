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
  const { user } = useContext(UserContext);
  const [edit, setEdit] = useState(false);

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
    hometown: yup
      .string()
      .max(15)
      .matches(/^[a-zA-Z0-9]{0,}$/, {
        message: "Special character not allowed.",
      }),
    worksAt: yup.string().max(15),
    school: yup.string().max(15),
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
      dateOfBirth: profile.dateOfBirth_toISODate,
      hometown: profile.hometown,
      worksAt: profile.worksAt,
      school: profile.school,
      relationship: profile.relationship,
    },
    resolver: yupResolver(schema),
  });

  const updateInfo = (data) => {
    console.log(data)
    axios
      .put(
        "/user/updateProfile",
        {
          id: profile.id,
          firstname: data.firstname,
          lastname: data.lastname,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
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
        setEdit(false);
        setRender(render + 1);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  console.log(profile)
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
              <p>First name:</p>
              <input
                {...register("firstname")}
                type="text"
                id="firtsname"
                label="First Name"
              />
            </label>
            <label htmlFor="lastname">
              <p> Last name:</p>

              <input
                {...register("lastname")}
                type="text"
                id="lastname"
                name="lastname"
              />
            </label>
            <label htmlFor="dateOfBirth">
              <p> Date of birth:</p>
              <input
                {...register("dateOfBirth")}
                type="date"
                name="dateOfBirth"
                id="dateOfBirth"
              />
            </label>
            <label htmlFor="hometown">
              <p> Hometown:</p>
              <input
                {...register("hometown")}
                type="text"
                name="hometown"
                id="hometown"
              />
            </label>
            <label htmlFor="worksAt">
              <p> Works at:</p>
              <input
                {...register("worksAt")}
                type="text"
                name="worksAt"
                id="worksAt"
              />
            </label>
            <label htmlFor="school">
              <p>Studied at:</p>
              <input
                {...register("school")}
                type="text"
                name="school"
                id="school"
              />
            </label>
            <label htmlFor="gender">
              <p>Gender:</p>
              <select
                {...register("gender")}
                id="gender"
                name="gender"
                defaultValue={{ label: "gender", value: "" }}
              >
                <option value="Male"> Male</option>
                <option value="Female"> Female</option>
                <option value="Non-binary"> Non-binary</option>
                <option value=""> Perefer not to say</option>
              </select>
            </label>
            <label htmlFor="relationship">
              <p>Relationship:</p>
              <select
                {...register("relationship")}
                id="relationship"
                name="relationship"
                defaultValue={{ label: "relationship", value: "" }}
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
