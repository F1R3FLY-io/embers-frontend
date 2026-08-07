import { createHash } from "node:crypto";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The evidence a run leaves behind.
 *
 * A finding is only worth sending upstream if it can be reproduced, and a
 * reproduction that says "the API returned something wrong" is not one. Each
 * HTTP call is therefore recorded whole -- request, response, timing, the
 * operation it resolved to, and a copy-pasteable curl -- so a finding can
 * quote the exact exchange that produced it.
 *
 * JSON Lines rather than a single document: a run that crashes halfway still
 * leaves a readable file, which is precisely the run whose evidence matters
 * most.
 *
 * Redaction is deliberate and narrow. Passwords and private keys are replaced
 * by their digests so that two occurrences can be compared without either
 * being readable. The prepare token is NOT redacted: reproducing a send
 * requires it, it expires within a day, and its signing secret is regenerated
 * per process, so recording it costs nothing and omitting it would make half
 * the findings unreproducible.
 */

const REDACTED_KEYS = new Set([
  "password",
  "private_key",
  "privateKey",
  "secret",
  "secret_key",
  "secretKey",
]);

export interface LedgerEntry {
  durationMs: number;
  method: string;
  operationId: string;
  requestBody?: unknown;
  responseBody?: unknown;
  scenarioId: string;
  seq: number;
  status: number;
  url: string;
  /** Conformance verdict, when one was computed for this call. */
  verdict?: "conforms" | "diverges" | "unchecked";
}

export function digest(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
}

/** Replaces credential-shaped values with their digests, recursively. */
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    result[key] = REDACTED_KEYS.has(key)
      ? digest(typeof inner === "string" ? inner : JSON.stringify(inner))
      : redact(inner);
  }
  return result;
}

/** A shell command that reproduces one recorded call. */
export function asCurl(entry: LedgerEntry): string {
  const parts = [
    "curl",
    "-i",
    "-X",
    entry.method.toUpperCase(),
    `'${entry.url}'`,
  ];
  if (entry.requestBody !== undefined) {
    parts.push("-H", "'content-type: application/json'");
    parts.push("-d", `'${JSON.stringify(redact(entry.requestBody))}'`);
  }
  return parts.join(" ");
}

export class Ledger {
  private seq = 0;

  public constructor(private readonly directory: string) {
    mkdirSync(directory, { recursive: true });
  }

  /** Records one HTTP exchange and returns the entry as written. */
  public record(entry: Omit<LedgerEntry, "seq">): LedgerEntry {
    this.seq += 1;
    const full: LedgerEntry = { ...entry, seq: this.seq };
    const line = JSON.stringify({
      ...full,
      curl: asCurl(full),
      requestBody: redact(full.requestBody),
      responseBody: redact(full.responseBody),
    });
    appendFileSync(join(this.directory, "ledger.jsonl"), `${line}\n`);
    return full;
  }

  /** Writes the run's provenance: what was probed, with what, against what. */
  public writeManifest(manifest: Record<string, unknown>): void {
    writeFileSync(
      join(this.directory, "run.json"),
      `${JSON.stringify(redact(manifest), null, 2)}\n`,
    );
  }

  public get count(): number {
    return this.seq;
  }
}
