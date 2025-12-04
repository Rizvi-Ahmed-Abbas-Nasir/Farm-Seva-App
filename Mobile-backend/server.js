import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import farmerRoutes from "./routes/farmerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";


const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/farmers", farmerRoutes);
app.use("/admin", adminRoutes);
app.use("/profile", profileRoutes);
app.use("/risk", riskRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log("Backend running on port " + process.env.PORT)
);
