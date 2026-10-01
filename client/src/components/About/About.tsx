import "./about.css";
import axios from "axios";
import { useState } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { MdModeEditOutline, MdOutlineWork, MdSchool } from "react-icons/md";
import { BsGenderAmbiguous } from "react-icons/bs";
import { FaUser, FaBirthdayCake, FaHeart, FaHome } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { handleError, errorMessage } from "../../utils/utils";
import type { User, SetRender } from "../../types";

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
    .max(30)
    .matches(/^[a-zA-Z0-9]{0,}$/, {
      message: "Special character not allowed.",
    }),
  worksAt: yup.string().max(30),
  school: yup.string().max(30),
  dateOfBirth: yup.date().max(new Date(), "Are you from the future?"),
  gender: yup.string(),
  relationship: yup.string(),
});

type AboutForm = yup.InferType<typeof schema>;

interface AboutProps {
  profile: User;
  setRender: SetRender;
  render: number;
}

export function About({ profile, setRender, render }: AboutProps) {
  const { user, setUser } = useCurrentUser();
  const [edit, setEdit] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstname: profile.firstname,
      lastname: profile.lastname,
      gender: profile.gender,
      // the date input only accepts yyyy-mm-dd
      dateOfBirth: (profile.dateOfBirth_toISODate ?? undefined) as unknown as Date,
      hometown: profile.hometown,
      worksAt: profile.worksAt,
      school: profile.school,
      relationship: profile.relationship,
    },
    resolver: yupResolver(schema),
  });

  const updateInfo = async (data: AboutForm) => {
    // only way i found to store date of birth without time in mongodb
    const date = data.dateOfBirth;
    const dateOfBirth = date
      ? new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      : undefined;

    try {
      await axios.put(`/user/updateProfile`, {
        id: profile.id,
        firstname: data.firstname,
        lastname: data.lastname,
        gender: data.gender,
        dateOfBirth,
        hometown: data.hometown,
        worksAt: data.worksAt,
        school: data.school,
        relationship: data.relationship,
      });
      getUser();
    } catch (err) {
      handleError(errorMessage(err));
    }
  };

  const getUser = async () => {
    try {
      const response = await axios.get<User>(`/user/profile/${profile.id}`);
      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
      setEdit(false);
      setRender(render + 1);
    } catch (err) {
      handleError(errorMessage(err));
    }
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
            <div>
              <label htmlFor="firstname">First name</label>
              <input
                {...register("firstname")}
                type="text"
                id="firstname"
              />
              <p className="error-about">{errors?.firstname?.message}</p>
            </div>
            <div>
              <label htmlFor="lastname">Last name</label>
              <input
                {...register("lastname")}
                type="text"
                id="lastname"
              />
              <p className="error-about">{errors?.lastname?.message}</p>
            </div>
            <div>
              <label htmlFor="dateOfBirth">Date of birth</label>
              <input
                {...register("dateOfBirth")}
                type="date"
                id="dateOfBirth"
              />
              <p className="error-about">{errors?.dateOfBirth?.message}</p>
            </div>
            <div>
              <label htmlFor="hometown">Hometown</label>
              <input
                {...register("hometown")}
                type="text"
                id="hometown"
              />
              <p className="error-about">{errors?.hometown?.message}</p>
            </div>

            <div>
              <label htmlFor="worksAt">Works at</label>
              <input
                {...register("worksAt")}
                type="text"
                id="worksAt"
              />
              <p className="error-about">{errors?.worksAt?.message}</p>
            </div>
            <div>
              <label htmlFor="school">Studied at</label>
              <input
                {...register("school")}
                type="text"
                id="school"
              />
              <p className="error-about">{errors?.school?.message}</p>
            </div>
            <div>
              <label htmlFor="gender">Gender</label>
              <select
                {...register("gender")}
                id="gender"
                defaultValue={""}
              >
                <option value="Male"> Male</option>
                <option value="Female"> Female</option>
                <option value="Non-binary"> Non-binary</option>
                <option value="">Prefer not to say</option>
              </select>
              <p className="error-about"></p>
            </div>
            <div>
              <label htmlFor="relationship">Relationship</label>
              <select
                {...register("relationship")}
                id="relationship"
                defaultValue={""}
              >
                <option value="Single">Single</option>
                <option value="In a relationship">In a relationship</option>
                <option value="In an open relationship">
                  In an open relationship
                </option>
                <option value="Married"> Married</option>
                <option value="Divorced"> Divorced</option>
                <option value=""> Prefer not to say</option>
              </select>
              <p className="error-about"></p>
            </div>
            <div className="buttons">
              <button onClick={() => setEdit(false)} type="button">
                Cancel
              </button>
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
              <FaBirthdayCake className="about-icon" />
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
