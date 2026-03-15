import { Router } from "express";

const router = Router();
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API = "https://api.github.com";

const githubFetch = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${err}`);
  }
  return response.json();
};

// GET /github/user
router.get("/user", async (req: any, res: any) => {
  try {
    const user = await githubFetch("/user") as any;
    res.json({
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      publicRepos: user.public_repos,
      bio: user.bio,
      followers: user.followers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /github/repos
router.get("/repos", async (req: any, res: any) => {
  try {
    const repos = await githubFetch("/user/repos?sort=updated&per_page=30") as any[];
    res.json(repos.map(r => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      htmlUrl: r.html_url,
      private: r.private,
      language: r.language,
      stars: r.stargazers_count,
      createdAt: r.created_at,
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /github/repos
router.post("/repos", async (req: any, res: any) => {
  const { name, description = "", private: isPrivate = false, autoInit = true } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  try {
    const repo = await githubFetch("/user/repos", {
      method: "POST",
      body: JSON.stringify({ name, description, private: isPrivate, auto_init: autoInit }),
    }) as any;
    res.status(201).json({
      id: repo.id, name: repo.name, fullName: repo.full_name,
      description: repo.description, htmlUrl: repo.html_url,
      private: repo.private, language: repo.language,
      stars: repo.stargazers_count, createdAt: repo.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
