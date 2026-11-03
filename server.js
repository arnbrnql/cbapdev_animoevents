require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const port = Number.parseInt(process.env.PORT || "3000", 10);

app.disable("x-powered-by");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", function (_req, res) {
  res.json({
    ok: true,
    service: "animoevents",
    mode: "static-demo-foundation",
  });
});

app.use(express.static(path.join(__dirname)));

if (require.main === module) {
  app.listen(port, function () {
    console.log("AnimoEvents server listening on http://localhost:" + port);
  });
}

module.exports = app;
