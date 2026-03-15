import { Router } from "express";

const router = Router();
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_API = "https://api.vercel.com";

const vercelFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${VERCEL_API}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Vercel API error ${response.status}: ${err}`);
  }
  return response.json();
};

// GET /vercel/projects
router.get("/projects", async (req: any, res: any) => {
  try {
    const data = await vercelFetch("/v9/projects?limit=20") as any;
    const projects = data.projects || [];
    res.json(projects.map((p: any) => ({
      id: p.id, name: p.name,
      url: p.alias?.[0]?.domain ? `https://${p.alias[0].domain}` : null,
      framework: p.framework,
      createdAt: new Date(p.createdAt).toISOString(),
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /vercel/deploy
router.post("/deploy", async (req: any, res: any) => {
  const { name, files } = req.body;
  if (!name || !files?.length) return res.status(400).json({ error: "name and files required" });
  try {
    const deployment = await vercelFetch("/v13/deployments", {
      method: "POST",
      body: JSON.stringify({
        name, files: files.map((f: any) => ({ file: f.file, data: f.data })),
        target: "production",
        projectSettings: { framework: null },
      }),
    }) as any;
    res.json({
      id: deployment.id,
      url: deployment.url ? `https://${deployment.url}` : "",
      state: deployment.readyState || "BUILDING",
      name: deployment.name || name,
      createdAt: new Date(deployment.createdAt).toISOString(),
      inspectorUrl: deployment.inspectorUrl || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /vercel/deployments/:id
router.get("/deployments/:id", async (req: any, res: any) => {
  try {
    const deployment = await vercelFetch(`/v13/deployments/${req.params.id}`) as any;
    res.json({
      id: deployment.id,
      url: deployment.url ? `https://${deployment.url}` : "",
      state: deployment.readyState || "BUILDING",
      name: deployment.name || "",
      createdAt: new Date(deployment.createdAt).toISOString(),
      inspectorUrl: deployment.inspectorUrl || null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
