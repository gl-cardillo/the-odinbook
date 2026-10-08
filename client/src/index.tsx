import ReactDOM from "react-dom/client";
import axios from "axios";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { queryClient } from "./queries";
import { readStorage, setAuthToken } from "./utils/utils";
import { applyTheme, readTheme } from "./utils/theme";

axios.defaults.baseURL = import.meta.env.VITE_API_URL;
// set before the first render so the first requests are already authenticated
setAuthToken(readStorage<string>("token"));
// before the first render, so the page never flashes the other theme
applyTheme(readTheme());

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
