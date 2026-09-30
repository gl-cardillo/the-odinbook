import { Link } from "react-router-dom";
import homePic from "../../images/home-pic.png";

export function GenericNotFound() {
  return (
    <div className="not-found-page">
      <img src={homePic} alt="logo" />
      <h1>Sorry, we couldn't find this page :(</h1>
      <Link to="/home">Go back home!</Link>
    </div>
  );
}
