CREATE INDEX IF NOT EXISTS "ingest_run_started_at_idx" ON "ingest_run" USING btree ("started_at" DESC);
