require("dotenv").config({ quiet: true });
require("./config/mongoDB");

const app = require("./app");

// listen only when run directly, bin/www and vercel import the app
if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server ready on port ${port}.`));
}

module.exports = app;
