// Packages Imported:
import express from "express";
import dotenv from "dotenv";

//Routes Imported:
import authRoutes from "./routes/auth.route.js";
import {connectDB} from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allows you to parse the body of the request
app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  connectDB();
});
