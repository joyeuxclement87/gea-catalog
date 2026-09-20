import { createServiceClient } from './supabase';
import { ensureBucketsExist } from './storage';
import { renderCataloguePdf } from './pdf-render';

export const PDF_BUCKET = 'catalogue-pdfs';
export const PDF_FOLDER = 'catalogue';
export const PDF_FILE_PATH = 'catalogue/GEA-Product-Catalogue-2026.pdf';
export const PDF_FILE_NAME = 'GEA-Product-Catalogue-2026.pdf';

export type PdfStatusName = 'current' | 'generating' | 'failed' | 'outdated';

export interface PdfStatusRow {
  id: string;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  generated_at: string | null;
  status: PdfStatusName;
  content_version: number | null;
  error_message: string | null;
  pending_since: string | null;
  updated_at: string | null;
}

export interface PdfStatusSummary {
  status: PdfStatusName;
  available: boolean;
  generating: boolean;
  generatedAt: string | null;
  fileSize: number | null;
  contentVersion: number;
  errorMessage: string | null;
  pendingSince: string | null;
}

export interface GenerationResult {
  status: 'current' | 'failed' | 'stale' | 'busy';
  error?: string;
  fileSize?: number;
}

const DEBOUNCE_SECONDS = Number(process.env.PDF_DEBOUNCE_SECONDS ?? 60) || 60;

let autoCheckTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Reads the single PDF status row. Returns null when the table is missing
 * (migration not applied) so callers can degrade gracefully.
 */
export async function getPdfStatus(): Promise<PdfStatusRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('catalogue_pdf_status')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as PdfStatusRow;
}

export function toPdfStatusSummary(row: PdfStatusRow | null): PdfStatusSummary {
  return {
    status: row?.status ?? 'outdated',
    available: Boolean(row && row.generated_at && (row.file_size ?? 0) > 0),
    generating: row?.status === 'generating',
    generatedAt: row?.generated_at ?? null,
    fileSize: row?.file_size ?? null,
    contentVersion: row?.content_version ?? 0,
    errorMessage: row?.error_message ?? null,
    pendingSince: row?.pending_since ?? null,
  };
}

/**
 * Ensures the singleton status row exists (creates it on first use). Returns
 * the row, or null when the table is not available yet.
 */
export async function ensurePdfStatusRow(): Promise<PdfStatusRow | null> {
  const existing = await getPdfStatus();
  if (existing) return existing;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('catalogue_pdf_status')
    .insert({
      file_path: PDF_FILE_PATH,
      file_name: PDF_FILE_NAME,
      file_size: 0,
      status: 'outdated',
      content_version: 0,
      error_message: null,
      pending_since: new Date().toISOString(),
    })
    .select()
    .maybeSingle();
  if (error || !data) return null;
  return data as PdfStatusRow;
}

/**
 * Marks the catalogue PDF as outdated. Called after every public-catalogue
 * database write (products, categories, sections, settings, images, order).
 * Bumps the content version and, unless a generation is already running,
 * moves the status to `outdated` so the automatic pipeline picks it up.
 * A short debounce coalesces several quick edits into one PDF generation.
 */
export async function markPdfOutdated(): Promise<boolean> {
  const row = await ensurePdfStatusRow();
  if (!row) return false;

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const nextVersion = (row.content_version ?? 0) + 1;
  const keepGenerating = row.status === 'generating';

  const patch: Record<string, unknown> = {
    content_version: nextVersion,
    pending_since: now,
    updated_at: now,
  };
  if (!keepGenerating) {
    patch.status = 'outdated';
    patch.error_message = null;
  }

  const { error } = await supabase.from('catalogue_pdf_status').update(patch).eq('id', row.id);
  if (error) return false;

  scheduleAutoPdfCheck();
  return true;
}

/**
 * In-process debounced auto-trigger. Several changes within the debounce
 * window reset the timer, so the catalogue settles before one generation runs.
 * The /api/catalogue/pdf/cron endpoint is the reliable fallback for serverless
 * and after restarts.
 */
function scheduleAutoPdfCheck(): void {
  if (autoCheckTimer) clearTimeout(autoCheckTimer);
  autoCheckTimer = setTimeout(() => {
    autoCheckTimer = null;
    void generateCataloguePdf();
  }, DEBOUNCE_SECONDS * 1000);
  if (typeof autoCheckTimer.unref === 'function') autoCheckTimer.unref();
}

/**
 * Atomically claims the generation lock. Only one job may run at a time;
 * concurrent callers receive null. The claimed content version lets the job
 * detect catalogue edits that arrive while it renders.
 */
async function claimGeneration(): Promise<{ id: string; contentVersion: number } | null> {
  const row = await ensurePdfStatusRow();
  if (!row) return null;
  if (row.status === 'generating') return null;

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('catalogue_pdf_status')
    .update({ status: 'generating', pending_since: now, updated_at: now, error_message: null })
    .eq('id', row.id)
    .neq('status', 'generating')
    .select()
    .single();
  if (error || !data) return null;
  return { id: data.id, contentVersion: data.content_version ?? 0 };
}

async function setStatusCurrent(fileSize: number): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('catalogue_pdf_status').update({
    status: 'current',
    file_path: PDF_FILE_PATH,
    file_name: PDF_FILE_NAME,
    file_size: fileSize,
    generated_at: new Date().toISOString(),
    error_message: null,
    updated_at: new Date().toISOString(),
  }).eq('status', 'generating');
}

async function setStatusFailed(message: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from('catalogue_pdf_status').update({
    status: 'failed',
    error_message: message.slice(0, 2000),
    updated_at: new Date().toISOString(),
  }).eq('status', 'generating');
}

/**
 * Uploads the freshly generated PDF at the fixed storage path with upsert
 * (replacing the previous file in place) and removes any stray PDF files so
 * the bucket only ever holds the one current catalogue PDF.
 */
async function uploadPdf(buffer: Buffer): Promise<{ fileSize: number }> {
  const supabase = createServiceClient();
  await ensureBucketsExist();

  const { error } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(PDF_FILE_PATH, buffer, {
      contentType: 'application/pdf',
      upsert: true,
      cacheControl: 'no-cache',
    });
  if (error) throw new Error(`PDF upload failed: ${error.message}`);

  await removeStrayPdfs();
  return { fileSize: buffer.byteLength };
}

async function removeStrayPdfs(): Promise<void> {
  const supabase = createServiceClient();

  const { data: folderFiles } = await supabase.storage.from(PDF_BUCKET).list(PDF_FOLDER);
  for (const file of folderFiles ?? []) {
    if (file.metadata === null) continue; // folder entry
    if (file.name === PDF_FILE_NAME) continue;
    await supabase.storage.from(PDF_BUCKET).remove([`${PDF_FOLDER}/${file.name}`]);
  }

  const { data: rootFiles } = await supabase.storage.from(PDF_BUCKET).list();
  for (const file of rootFiles ?? []) {
    if (file.metadata === null) continue; // the catalogue/ folder itself
    if (file.name === PDF_FOLDER) continue;
    await supabase.storage.from(PDF_BUCKET).remove([file.name]);
  }
}

export interface GenerateOptions {
  /** Absolute base URL used to render /catalogue/print. */
  baseUrl?: string;
  /** Marks the request as manual (admin button) — bypasses debounce flags. */
  manual?: boolean;
}

/**
 * Runs the full generation pipeline: claim → render → verify → upload →
 * update status. Never destroys the previous working PDF: the upload only
 * happens after a successful render. If a catalogue edit arrives mid-render,
 * the render is discarded (stale) and a fresh one is scheduled.
 */
export async function generateCataloguePdf(options: GenerateOptions = {}): Promise<GenerationResult> {
  const claimed = await claimGeneration();
  if (!claimed) return { status: 'busy' };

  const supabase = createServiceClient();
  const versionAtStart = claimed.contentVersion;

  try {
    const buffer = await renderCataloguePdf(options.baseUrl);

    // Verify the job is still the current one and no edits arrived mid-render.
    const { data: current } = await supabase
      .from('catalogue_pdf_status')
      .select('*')
      .eq('id', claimed.id)
      .single();
    const stillGenerating = current?.status === 'generating';
    const versionUnchanged = (current?.content_version ?? versionAtStart) === versionAtStart;

    if (!stillGenerating || !versionUnchanged) {
      // A catalogue change landed during generation — do not overwrite the
      // working PDF with stale content. Fall back to overdue so a fresh
      // generation is scheduled once the catalogue settles.
      await supabase.from('catalogue_pdf_status').update({
        status: 'outdated',
        pending_since: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        error_message: null,
      }).eq('id', claimed.id);
      scheduleAutoPdfCheck();
      return { status: 'stale' };
    }

    const { fileSize } = await uploadPdf(buffer);
    await setStatusCurrent(fileSize);
    return { status: 'current', fileSize };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await setStatusFailed(message);
    return { status: 'failed', error: message };
  }
}

/** Convenience used by the cron route to check whether a settled overdue exists. */
export function isDebounceElapsed(row: PdfStatusRow): boolean {
  if (!row.pending_since) return true;
  const since = new Date(row.pending_since).getTime();
  if (Number.isNaN(since)) return true;
  return Date.now() - since >= DEBOUNCE_SECONDS * 1000;
}