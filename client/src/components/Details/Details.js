import "./details.css";
import axios from "axios";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../dataContext/dataContext";
import { MdModeEditOutline } from "react-icons/md";

export function Details({ profile }) {
  const { user } = useContext(UserContext);

  return (
    <div className="details-container">
      {profile.id === user.id && <MdModeEditOutline className="edit-button" />}
      <p>Name: {profile.fullname}</p>
      <p>Gender:{profile.gender && profile.gender}</p>
      <p>Date of Birth:{profile.dateOfBirth && profile.dateOfBirth} </p>
      <p>Hometown:{profile.hometown && profile.hometown}</p>
    </div>
  );
}
