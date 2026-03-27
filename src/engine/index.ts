/**
 * bibguard — Detect hallucinated and broken citations in academic papers.
 *
 * Works in both Node.js (>=18) and modern browsers (fetch API required).
 *
 * @example
 * ```ts
 * import { parseBib, verifyAll } from "bibguard";
 * const entries = parseBib(bibText);
 * const results = await verifyAll(entries);
 * ```
 *
 * @packageDocumentation
 */

export { parseBib } from "./parsers/bibtex";
export { verifyEntry, verifyAll } from "./core";
export type { ProgressCallback } from "./core";
export type { BibEntry, VerificationResult, Check, SourceResult, ReportSummary } from "./types";
export { tokenSimilarity, matchTitle, matchAuthors, matchYear, matchVenue } from "./matching";
