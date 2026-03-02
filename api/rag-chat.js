import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Missing question" });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. Generate embedding
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });

    // 2. Semantic search
    const { data: docs, error } = await supabase.rpc("match_documents", {
      query_embedding: emb.data[0].embedding,
      match_threshold: 0.75,
      match_count: 4,
    });

    if (error) throw error;

    // 3. Build context
    const context = docs.map((d) => d.content).join("\n\n");

    // 4. RAG prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Jesteś asystentem Susstyle. Odpowiadaj na podstawie poniższego kontekstu z dokumentacji:\n\n${context}`,
        },
        { role: "user", content: question },
      ],
      temperature: 0.7,
    });

    return res.status(200).json({
      answer: completion.choices[0].message.content,
      sources: docs.map((d) => ({ title: d.title, similarity: d.similarity })),
    });
  } catch (error) {
    console.error("RAG error:", error);
    return res.status(500).json({ error: error.message });
  }
}
