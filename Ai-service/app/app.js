import express from "express";
import aiSessionRoutes from "../routes/aiSession.routes.js";

const app = express();

app.use(express.json({ limit: "10mb" }));

app.use(aiSessionRoutes);

export default app;