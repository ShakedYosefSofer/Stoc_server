const indexR = require("./index");
const usersR = require("./users");
const cookiesR = require("./cookies");
const jobRoutes = require("./jobs");
// const citiesR = require("./cities");

exports.routesInit = (app) => {
  // הגדרת ראוטים לאיזה ראוטר הם שייכים
  app.use("/", indexR);
  app.use("/users", usersR);
  app.use("/cookies", cookiesR);
  app.use("/jobs", jobRoutes); // Prefix all job routes with /api/jobs
  // app.use("/cities", citiesR ); // Prefix all city routes with /api/cities
}