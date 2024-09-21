import express from "express";

const app = express();
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`The server is running at http://localhost:${port}/`);
});
