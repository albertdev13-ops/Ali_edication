import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const TMP_DIR = "/tmp/generated";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// POST /images/understand - analyze an image with Gemini Vision
router.post("/understand", async (req: any, res: any) => {
  const { imageBase64, mimeType = "image/jpeg", question = "Décris cette image en détail." } = req.body;
  if (!imageBase64) return res.status(400).json({ error: "imageBase64 required" });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: question },
          { inlineData: { mimeType, data: imageBase64 } },
        ],
      }],
    });
    const description = result.response.text();
    res.json({ description, question });
  } catch (err: any) {
    req.log.error(err, "image understand error");
    res.status(500).json({ error: err.message || "Vision analysis failed" });
  }
});

// POST /images/generate - generate an image with Gemini
router.post("/generate", async (req: any, res: any) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-preview-image-generation",
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      // @ts-ignore
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    });

    const parts = result.response.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));

    if (!imagePart?.inlineData) {
      return res.status(500).json({ error: "No image generated" });
    }

    // Save to file
    const ext = imagePart.inlineData.mimeType.split("/")[1] || "png";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filePath = path.join(TMP_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(imagePart.inlineData.data, "base64"));

    const textPart = parts.find((p: any) => p.text);

    res.json({
      imageUrl: `/api/images/file/${filename}`,
      mimeType: imagePart.inlineData.mimeType,
      caption: textPart?.text || prompt,
    });
  } catch (err: any) {
    req.log.error(err, "image generate error");
    res.status(500).json({ error: err.message || "Image generation failed" });
  }
});

// GET /images/file/:filename - serve generated images
router.get("/file/:filename", (req: any, res: any) => {
  const filePath = path.join(TMP_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Image not found" });
  const ext = path.extname(req.params.filename).replace(".", "");
  const mimeMap: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
  res.setHeader("Content-Type", mimeMap[ext] || "image/png");
  res.setHeader("Cache-Control", "public, max-age=3600");
  fs.createReadStream(filePath).pipe(res);
});

export default router;
