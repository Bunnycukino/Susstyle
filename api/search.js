import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body;

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing query" });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Generate embedding for query
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryEmbedding = emb.data[0].embedding;

    // Semantic search in Supabase
    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.75,
      match_count: 6,
    });

    if (error) throw error;

    return res.status(200).json({ results: data ?? [] });
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ error: error.message });
  }
}
