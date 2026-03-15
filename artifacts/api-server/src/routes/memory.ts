import { Router } from "express";
import { db } from "@workspace/db";
import { memoryCacheTable } from "@workspace/db";
import { desc, like, or, eq } from "drizzle-orm";

const router = Router();

// GET /memory - list all memory entries
router.get("/", async (req: any, res: any) => {
  const limit = parseInt((req.query.limit as string) || "20");
  try {
    const entries = await db.select().from(memoryCacheTable).orderBy(desc(memoryCacheTable.lastAccessedAt)).limit(limit);
    res.json(entries.map(e => ({
      id: e.id,
      prompt: e.prompt.slice(0, 200),
      response: e.response.slice(0, 500),
      model: e.model,
      accessCount: e.accessCount,
      createdAt: e.createdAt.toISOString(),
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /memory/search - search memory
router.get("/search", async (req: any, res: any) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "q required" });
  try {
    const entries = await db.select().from(memoryCacheTable)
      .where(or(like(memoryCacheTable.prompt, `%${q}%`), like(memoryCacheTable.response, `%${q}%`)))
      .orderBy(desc(memoryCacheTable.accessCount)).limit(10);
    res.json(entries.map(e => ({
      id: e.id,
      prompt: e.prompt.slice(0, 200),
      response: e.response.slice(0, 500),
      model: e.model,
      accessCount: e.accessCount,
      createdAt: e.createdAt.toISOString(),
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /memory - clear all memory
router.delete("/", async (req: any, res: any) => {
  try {
    await db.delete(memoryCacheTable);
    res.json({ success: true, message: "Memory cleared" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
