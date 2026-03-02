import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  throw new Error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const DOCS_DIR = path.join(process.cwd(), "docs");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function chunkText(text, maxChars = 1200, overlap = 150) {
  const clean = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const chunks = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + maxChars, clean.length);
    const slice = clean.slice(i, end).trim();
    if (slice) chunks.push(slice);
    i = end - overlap;
    if (i < 0) i = 0;
    if (end === clean.length) break;
  }
  return chunks;
}

async function embed(input) {
  const r = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });
  return r.data[0].embedding;
}

(async () => {
  if (!fs.existsSync(DOCS_DIR)) throw new Error("Missing /docs folder");
  const files = walk(DOCS_DIR).filter((f) => f.toLowerCase().endsWith(".md"));
  console.log(`📚 Found ${files.length} markdown files`);

  for (const file of files) {
    const md = fs.readFileSync(file, "utf8");
    const rel = path.relative(process.cwd(), file);
    const title = path.basename(file, ".md");
    const chunks = chunkText(md);
    console.log(`📄 Processing ${rel} (${chunks.length} chunks)`);

    for (let idx = 0; idx < chunks.length; idx++) {
      const content = chunks[idx];
      const embedding = await embed(content);
      const { error } = await supabase.from("documents").insert({
        source: "docs",
        path: rel,
        title: `${title} (#${idx + 1})`,
        content,
        embedding,
      });
      if (error) throw error;
      process.stdout.write(".");
    }
    console.log(" ✅");
  }
  console.log("🎉 Ingestion complete!");
})();
