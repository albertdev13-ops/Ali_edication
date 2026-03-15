import { Router } from "express";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router = Router();
const TMP_DIR = "/tmp/tts";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// 4 best Microsoft Edge TTS voices
const VOICES = [
  {
    id: "fr-FR-HenriNeural",
    name: "Henri",
    language: "Français",
    gender: "Masculin",
    description: "Voix masculine française naturelle et professionnelle",
    preview: null,
  },
  {
    id: "fr-FR-DeniseNeural",
    name: "Denise",
    language: "Français",
    gender: "Féminin",
    description: "Voix féminine française chaleureuse et expressive",
    preview: null,
  },
  {
    id: "en-US-ChristopherNeural",
    name: "Christopher",
    language: "English (US)",
    gender: "Male",
    description: "Deep, authoritative American English voice",
    preview: null,
  },
  {
    id: "en-US-AriaNeural",
    name: "Aria",
    language: "English (US)",
    gender: "Female",
    description: "Expressive, warm American English voice",
    preview: null,
  },
];

// GET /tts/voices
router.get("/voices", (_req: any, res: any) => {
  res.json(VOICES);
});

// POST /tts/synthesize
router.post("/synthesize", async (req: any, res: any) => {
  const { text, voiceId = "fr-FR-HenriNeural" } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  const truncatedText = text.slice(0, 5000);
  const fileId = crypto.randomUUID();
  const filePath = path.join(TMP_DIR, `${fileId}.mp3`);

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioFilePath } = await tts.toFile(TMP_DIR, truncatedText);

    // Copy to our named file
    fs.copyFileSync(audioFilePath, filePath);
    try { fs.unlinkSync(audioFilePath); } catch (_) { /* ignore */ }

    const duration = Math.max(1, Math.ceil(truncatedText.split(" ").length * 0.4));

    res.json({
      audioUrl: `/api/tts/audio/${fileId}.mp3`,
      duration,
      text: truncatedText,
    });
  } catch (err: any) {
    req.log.error(err, "TTS error");
    res.status(500).json({ error: err.message || "TTS synthesis failed" });
  }
});

// GET /tts/audio/:filename - serve audio files
router.get("/audio/:filename", (req: any, res: any) => {
  const filePath = path.join(TMP_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Audio not found" });
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "public, max-age=3600");
  fs.createReadStream(filePath).pipe(res);
});

export default router;
