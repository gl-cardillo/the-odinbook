import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import { readStorage, setAuthToken } from "./utils/utils";

axios.defaults.baseURL = import.meta.env.VITE_API_URL;
// set before the first render so the first requests are already authenticated
setAuthToken(readStorage<string>("token"));

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
