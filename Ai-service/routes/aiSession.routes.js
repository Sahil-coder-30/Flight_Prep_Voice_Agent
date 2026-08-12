import express from "express";

import { identifyUser } from "../middleware/identifyUser.middleware.js";
import { apiRateLimiter } from "../middleware/rate-limit.middleware.js";
import * as aiSessionController from "../controllers/aiSession.controller.js";

// console.log(
//     "[DEBUG] aiSessionController exports:",
//     Object.keys(aiSessionController)
// );

// console.log(
//     "[DEBUG] typeof turn:",
//     typeof aiSessionController.turn
// );

// console.log(
//     "[DEBUG] typeof getTranscript:",
//     typeof aiSessionController.getTranscript
// );

const router = express.Router();

router.use(identifyUser, apiRateLimiter);

router.post(
    "/sessions/:id/turn",
    aiSessionController.turn
);

router.get(
    "/sessions/:id/transcript",
    aiSessionController.getTranscript
);

export default router;