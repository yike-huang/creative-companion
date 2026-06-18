import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=").replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const embeddingModel =
  process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const batchSize = Number(process.env.EMBEDDING_BATCH_SIZE ?? 25);

if (!supabaseUrl || !serviceRoleKey || !openaiApiKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
const openai = new OpenAI({ apiKey: openaiApiKey });

const { data: chunks, error } = await supabase
  .from("resource_chunks")
  .select("id, chunk_text")
  .is("embedding", null)
  .order("created_at", { ascending: true })
  .limit(batchSize);

if (error) {
  console.error(`Unable to load resource chunks: ${error.message}`);
  process.exit(1);
}

if (!chunks || chunks.length === 0) {
  console.log("All resource chunks already have embeddings.");
  process.exit(0);
}

console.log(`Embedding ${chunks.length} resource chunk(s)...`);

for (const chunk of chunks) {
  const embeddingResponse = await openai.embeddings.create({
    model: embeddingModel,
    input: chunk.chunk_text,
    dimensions: 1536,
  });

  const embedding = embeddingResponse.data[0]?.embedding;

  if (!embedding) {
    console.error(`No embedding returned for chunk ${chunk.id}.`);
    process.exit(1);
  }

  const { error: updateError } = await supabase
    .from("resource_chunks")
    .update({ embedding })
    .eq("id", chunk.id);

  if (updateError) {
    console.error(
      `Unable to update embedding for chunk ${chunk.id}: ${updateError.message}`,
    );
    process.exit(1);
  }

  console.log(`Embedded chunk ${chunk.id}`);
}

console.log("Done.");
