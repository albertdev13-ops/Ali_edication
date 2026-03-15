import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import memoryRouter from "./memory";
import ttsRouter from "./tts";
import filesRouter from "./files";
import githubRouter from "./github";
import vercelRouter from "./vercel";
import settingsRouter from "./settings";
import searchRouter from "./search";
import imagesRouter from "./images";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use("/memory", memoryRouter);
router.use("/tts", ttsRouter);
router.use("/files", filesRouter);
router.use("/github", githubRouter);
router.use("/vercel", vercelRouter);
router.use("/settings", settingsRouter);
router.use("/search", searchRouter);
router.use("/images", imagesRouter);

export default router;
