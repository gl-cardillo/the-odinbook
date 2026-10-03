import "./config/env.js";
import "./config/mongoDB.js";
import { pathToFileURL } from "node:url";
import app from "./app.js";

// listen only when run directly, vercel imports the app
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server ready on port ${port}.`));
}

export default app;
