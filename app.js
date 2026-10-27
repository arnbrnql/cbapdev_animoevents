const app = require("./server");

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT || "3000", 10);
  app.listen(port, function () {
    console.log("AnimoEvents server listening on http://localhost:" + port);
  });
}

module.exports = app;
