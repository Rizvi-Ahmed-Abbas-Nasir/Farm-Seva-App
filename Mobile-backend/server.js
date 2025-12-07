import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import farmerRoutes from "./routes/farmerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";
import vaccinationRoutes from "./routes/vaccinationRoutes.js";
import checkupRoutes from "./routes/checkupRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";

const app = express();



app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/farmers", farmerRoutes);
app.use("/admin", adminRoutes);
app.use("/profile", profileRoutes);
app.use("/risk", riskRoutes);
app.use("/vaccinations", vaccinationRoutes);
app.use("/checkups", checkupRoutes);
app.use("/schedules", scheduleRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log("Backend running on port " + process.env.PORT)
);
