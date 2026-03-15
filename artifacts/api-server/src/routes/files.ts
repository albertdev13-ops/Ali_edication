import { Router } from "express";
import PDFDocument from "pdfkit";
import { createRequire } from "module";
const _require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const archiver: any = _require("archiver");
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "@workspace/db";
import { generatedFilesTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();
const FILES_DIR = "/tmp/generated";
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });

// POST /files/pdf
router.post("/pdf", async (req: any, res: any) => {
  const { title, content, format = "A4" } = req.body;
  if (!title || !content) return res.status(400).json({ error: "title and content required" });

  const fileId = crypto.randomUUID();
  const filename = `${fileId}.pdf`;
  const filePath = path.join(FILES_DIR, filename);

  try {
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: format, margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.font("Helvetica-Bold").fontSize(22).fillColor("#1a1a2e").text(title, { align: "center" });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#6366f1").lineWidth(2).stroke();
      doc.moveDown();

      // Content
      doc.font("Helvetica").fontSize(11).fillColor("#333333").text(content, { align: "left", lineGap: 4 });

      // Footer
      doc.moveDown(2);
      doc.fontSize(9).fillColor("#888888").text(`Généré par Humain Numérique — ${new Date().toLocaleDateString("fr-FR")}`, { align: "center" });

      doc.end();
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    const stat = fs.statSync(filePath);
    const name = `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;

    const [file] = await db.insert(generatedFilesTable).values({
      name, type: "pdf", filePath: filename, size: stat.size,
    }).returning();

    res.json({ id: file.id, name, type: "pdf", downloadUrl: `/api/files/download/${filename}`, size: stat.size, createdAt: file.createdAt.toISOString() });
  } catch (err: any) {
    req.log.error(err, "PDF generation error");
    res.status(500).json({ error: err.message });
  }
});

// POST /files/zip
router.post("/zip", async (req: any, res: any) => {
  const { name, files } = req.body;
  if (!name || !files?.length) return res.status(400).json({ error: "name and files required" });

  const fileId = crypto.randomUUID();
  const filename = `${fileId}.zip`;
  const filePath = path.join(FILES_DIR, filename);

  try {
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(filePath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      output.on("close", resolve);
      archive.on("error", reject);
      archive.pipe(output);
      for (const f of files) {
        archive.append(f.content, { name: f.filename });
      }
      archive.finalize();
    });

    const stat = fs.statSync(filePath);
    const zipName = `${name.replace(/[^a-z0-9]/gi, "_")}.zip`;

    const [file] = await db.insert(generatedFilesTable).values({
      name: zipName, type: "zip", filePath: filename, size: stat.size,
    }).returning();

    res.json({ id: file.id, name: zipName, type: "zip", downloadUrl: `/api/files/download/${filename}`, size: stat.size, createdAt: file.createdAt.toISOString() });
  } catch (err: any) {
    req.log.error(err, "ZIP generation error");
    res.status(500).json({ error: err.message });
  }
});

// GET /files/list
router.get("/list", async (req: any, res: any) => {
  try {
    const files = await db.select().from(generatedFilesTable).orderBy(desc(generatedFilesTable.createdAt)).limit(20);
    res.json(files.map(f => ({ id: f.id, name: f.name, type: f.type, downloadUrl: `/api/files/download/${f.filePath}`, size: f.size, createdAt: f.createdAt.toISOString() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /files/download/:filename - serve files
router.get("/download/:filename", (req: any, res: any) => {
  const filePath = path.join(FILES_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  const ext = path.extname(req.params.filename).toLowerCase();
  const contentType = ext === ".pdf" ? "application/pdf" : "application/zip";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${req.params.filename}"`);
  fs.createReadStream(filePath).pipe(res);
});

export default router;
