import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// POST /search - real-time web search via Gemini Google Search grounding
router.post("/", async (req: any, res: any) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      // @ts-ignore — googleSearch tool is valid in Gemini 2.0
      tools: [{ googleSearch: {} }],
    });

    const result = await model.generateContent(
      `Recherche en temps réel: ${query}\n\nFournis un résumé concis et précis avec les informations les plus récentes. Inclus les sources avec leurs URLs.`
    );

    const response = result.response;
    const text = response.text();

    // Extract grounding metadata / citations
    const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
    const sources: Array<{ title: string; url: string; snippet?: string }> = [];

    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title || "Source",
            url: chunk.web.uri || "",
          });
        }
      }
    }

    // Also extract any inline links from text
    const urlRegex = /https?:\/\/[^\s\)]+/g;
    const inlineUrls = text.match(urlRegex) || [];
    for (const url of inlineUrls) {
      if (!sources.find((s) => s.url === url)) {
        sources.push({ title: url, url });
      }
    }

    res.json({ summary: text, sources: sources.slice(0, 10), query });
  } catch (err: any) {
    req.log.error(err, "search error");
    res.status(500).json({ error: err.message || "Search failed" });
  }
});

export default router;
