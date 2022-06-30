import { Link } from "react-router-dom";

export function GenericNotFound() {
  return (
    <div className="not-found-page">
      <img src={require("../../images/home-pic.png")} alt="logo" />
      <h1>Sorry, we couldn't find this page :(</h1>
      <Link to="/home">Go back home!</Link>
    </div>
  );
}
