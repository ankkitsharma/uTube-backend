import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const mongoose_uri = process.env.MONGODB_URI;

async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(
      `${mongoose_uri}/${DB_NAME}`
    );
    console.log(
      `\n MongDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("DB Connection error", error);
    process.exit(1);
  }
}

export default connectDB;
