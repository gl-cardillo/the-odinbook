import { useState } from "react";
import type { ReactNode } from "react";
import { useCurrentUser } from "../../dataContext/dataContext";
import { MdModeEditOutline, MdOutlineWork, MdSchool } from "react-icons/md";
import { BsGenderAmbiguous } from "react-icons/bs";
import { FaBirthdayCake, FaHeart, FaHome } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useUpdateProfile } from "../../queries";
import { Alert, Button, Card, Field, inputProps } from "../ui";
import type { User } from "../../types";
import styles from "./About.module.scss";

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
  // an empty date input means no date, not an invalid one
  dateOfBirth: yup
    .date()
    .transform((value, original) => (original === "" ? undefined : value))
    .max(new Date(), "Are you from the future?"),
  gender: yup.string(),
  relationship: yup.string(),
});

type AboutForm = yup.InferType<typeof schema>;

function Detail({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className={styles.detail}>
      <span className={styles.icon} aria-hidden>
        {icon}
      </span>
      <span>{children}</span>
    </li>
  );
}

export function About({ profile }: { profile: User }) {
  const { user, updateUser } = useCurrentUser();
  const [edit, setEdit] = useState(false);
  const isMe = profile.id === user.id;
  const updateProfile = useUpdateProfile((saved) => {
    updateUser(saved);
    setEdit(false);
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstname: profile.firstname,
      lastname: profile.lastname,
      gender: profile.gender ?? "",
      // the date input only accepts yyyy-mm-dd
      dateOfBirth: (profile.dateOfBirth_toISODate ??
        undefined) as unknown as Date,
      hometown: profile.hometown,
      worksAt: profile.worksAt,
      school: profile.school,
      relationship: profile.relationship ?? "",
    },
    resolver: yupResolver(schema),
  });

  const updateInfo = (data: AboutForm) => {
    // keep the day picked whatever the timezone, mongo stores it as utc midnight
    const date = data.dateOfBirth;
    const dateOfBirth = date
      ? new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      : undefined;

    updateProfile.mutate({
      firstname: data.firstname,
      lastname: data.lastname,
      gender: data.gender,
      dateOfBirth,
      hometown: data.hometown,
      worksAt: data.worksAt,
      school: data.school,
      relationship: data.relationship,
    });
  };

  const cancel = () => {
    reset();
    updateProfile.reset();
    setEdit(false);
  };

  const hasDetails =
    profile.gender ||
    profile.dateOfBirth ||
    profile.hometown ||
    profile.worksAt ||
    profile.school ||
    profile.relationship;

  return (
    <Card
      title={edit ? "Edit details" : "About"}
      action={
        isMe &&
        !edit && (
          <Button variant="secondary" size="sm" onClick={() => setEdit(true)}>
            <MdModeEditOutline aria-hidden />
            Edit details
          </Button>
        )
      }
    >
      {edit ? (
        <form
          className={styles.form}
          onSubmit={handleSubmit(updateInfo)}
          noValidate
        >
          <div className={styles.fields}>
            <Field
              id="firstname"
              label="First name"
              error={errors.firstname?.message}
            >
              <input
                {...inputProps("firstname", errors.firstname?.message)}
                {...register("firstname")}
                type="text"
              />
            </Field>
            <Field
              id="lastname"
              label="Last name"
              error={errors.lastname?.message}
            >
              <input
                {...inputProps("lastname", errors.lastname?.message)}
                {...register("lastname")}
                type="text"
              />
            </Field>
            <Field
              id="dateOfBirth"
              label="Date of birth"
              error={errors.dateOfBirth?.message}
            >
              <input
                {...inputProps("dateOfBirth", errors.dateOfBirth?.message)}
                {...register("dateOfBirth")}
                type="date"
              />
            </Field>
            <Field
              id="hometown"
              label="Hometown"
              error={errors.hometown?.message}
            >
              <input
                {...inputProps("hometown", errors.hometown?.message)}
                {...register("hometown")}
                type="text"
              />
            </Field>
            <Field
              id="worksAt"
              label="Works at"
              error={errors.worksAt?.message}
            >
              <input
                {...inputProps("worksAt", errors.worksAt?.message)}
                {...register("worksAt")}
                type="text"
              />
            </Field>
            <Field
              id="school"
              label="Studied at"
              error={errors.school?.message}
            >
              <input
                {...inputProps("school", errors.school?.message)}
                {...register("school")}
                type="text"
              />
            </Field>
            <Field id="gender" label="Gender">
              <select {...inputProps("gender")} {...register("gender")}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="">Prefer not to say</option>
              </select>
            </Field>
            <Field id="relationship" label="Relationship">
              <select
                {...inputProps("relationship")}
                {...register("relationship")}
              >
                <option value="Single">Single</option>
                <option value="In a relationship">In a relationship</option>
                <option value="In an open relationship">
                  In an open relationship
                </option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="">Prefer not to say</option>
              </select>
            </Field>
          </div>
          {updateProfile.isError && (
            <Alert>Your details could not be saved, try again</Alert>
          )}
          <div className={styles.buttons}>
            <Button variant="secondary" onClick={cancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              Save
            </Button>
          </div>
        </form>
      ) : hasDetails ? (
        <ul className={styles.details} data-cy="about-details">
          {profile.worksAt && (
            <Detail icon={<MdOutlineWork />}>Works at {profile.worksAt}</Detail>
          )}
          {profile.school && (
            <Detail icon={<MdSchool />}>Studied at {profile.school}</Detail>
          )}
          {profile.hometown && (
            <Detail icon={<FaHome />}>From {profile.hometown}</Detail>
          )}
          {profile.dateOfBirth && (
            <Detail icon={<FaBirthdayCake />}>
              Born on {profile.dateOfBirth_formatted}
            </Detail>
          )}
          {profile.gender && (
            <Detail icon={<BsGenderAmbiguous />}>{profile.gender}</Detail>
          )}
          {profile.relationship && (
            <Detail icon={<FaHeart />}>{profile.relationship}</Detail>
          )}
        </ul>
      ) : (
        <p className={styles.empty}>
          {isMe
            ? "Add some details so people can get to know you"
            : "No details to show"}
        </p>
      )}
    </Card>
  );
}
