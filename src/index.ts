import express from "express";
import connectDB from "./db";

const app = express();
const port = process.env.PORT;

connectDB();

app.listen(port, () => {
  console.log(`The server is running at http://localhost:${port}/`);
});
