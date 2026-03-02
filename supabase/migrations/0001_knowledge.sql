-- RAG Knowledge Base with pgvector
-- Supabase migration for semantic search

create extension if not exists vector;

create table if not exists documents (
  id bigint primary key generated always as identity,
  source text,
  path text,
  title text,
  content text,
  embedding vector(1536)
);

create index if not exists documents_embedding_ivfflat
on documents using ivfflat (embedding vector_cosine_ops);

create or replace function match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  title text,
  content text,
  similarity float
)
language sql stable as $$
  select
    documents.id,
    documents.title,
    documents.content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by (documents.embedding <=> query_embedding) asc
  limit least(match_count, 200);
$$;
