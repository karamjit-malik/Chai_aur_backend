import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `MongoDB connected successfully | Host: ${connectionInstance.connection.host} | DB: ${connectionInstance.connection.name}`
    );
  } catch (err) {
    console.error("Error connecting to MongoDB hai bhai:", err);
    process.exit(1);
  }
};

export default connectDB;