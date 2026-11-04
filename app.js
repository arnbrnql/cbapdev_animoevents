require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

if (require.main === module) {
  app.listen(port, function () {
    console.log("AnimoEvents server listening on http://localhost:" + port);
  });
}

module.exports = app;
