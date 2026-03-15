import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULT_SETTINGS = {
  defaultModel: "groq" as const,
  defaultVoiceId: "fr-FR-HenriNeural",
  streamingEnabled: true,
  autoSave: true,
  systemPrompt: "Mode Prof actif. Réponds comme ALI, Humain Numérique et Prof de Kinshasa. Dis Boss dans chaque phrase.",
  fontSize: "medium" as const,
};

async function getOrCreateSettings() {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, 1)).limit(1);
  if (rows.length > 0) return rows[0];
  await db.insert(settingsTable).values({ id: 1, ...DEFAULT_SETTINGS }).onConflictDoNothing();
  const [s] = await db.select().from(settingsTable).where(eq(settingsTable.id, 1)).limit(1);
  return s;
}

// GET /settings
router.get("/", async (req: any, res: any) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      defaultModel: settings.defaultModel,
      defaultVoiceId: settings.defaultVoiceId,
      streamingEnabled: settings.streamingEnabled,
      autoSave: settings.autoSave,
      systemPrompt: settings.systemPrompt,
      fontSize: settings.fontSize,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /settings
router.put("/", async (req: any, res: any) => {
  try {
    const { defaultModel, defaultVoiceId, streamingEnabled, autoSave, systemPrompt, fontSize } = req.body;
    await getOrCreateSettings();
    const updates: Partial<typeof DEFAULT_SETTINGS & { updatedAt: Date }> = { updatedAt: new Date() } as any;
    if (defaultModel !== undefined) (updates as any).defaultModel = defaultModel;
    if (defaultVoiceId !== undefined) (updates as any).defaultVoiceId = defaultVoiceId;
    if (streamingEnabled !== undefined) (updates as any).streamingEnabled = streamingEnabled;
    if (autoSave !== undefined) (updates as any).autoSave = autoSave;
    if (systemPrompt !== undefined) (updates as any).systemPrompt = systemPrompt;
    if (fontSize !== undefined) (updates as any).fontSize = fontSize;

    await db.update(settingsTable).set(updates as any).where(eq(settingsTable.id, 1));
    const updated = await getOrCreateSettings();
    res.json({
      defaultModel: updated.defaultModel,
      defaultVoiceId: updated.defaultVoiceId,
      streamingEnabled: updated.streamingEnabled,
      autoSave: updated.autoSave,
      systemPrompt: updated.systemPrompt,
      fontSize: updated.fontSize,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
