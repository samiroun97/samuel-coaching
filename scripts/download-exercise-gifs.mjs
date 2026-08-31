import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://oss.exercisedb.dev/api/v1/exercises";
const OUT_DIR = path.resolve("data/exercises");
const GIF_DIR = path.join(OUT_DIR, "gifs");
const CONCURRENCY = 8;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, options = {}, maxAttempts = 6) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429 && !(res.status >= 500 && res.status < 600)) return res;

    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 1000 * 2 ** attempt;

    if (attempt === maxAttempts) return res;
    await sleep(wait);
  }
}

async function fetchAllExercises() {
  const exercises = [];
  let cursor;

  while (true) {
    const url = new URL(API_BASE);
    url.searchParams.set("limit", "25");
    if (cursor) url.searchParams.set("after", cursor);

    const res = await fetchWithRetry(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`API error ${res.status} on ${url}`);
    const { meta, data } = await res.json();

    exercises.push(...data);
    process.stdout.write(`\rExercices récupérés : ${exercises.length}/${meta.total}`);

    if (!meta.hasNextPage) break;
    cursor = meta.nextCursor;
    await sleep(350);
  }
  console.log();
  return exercises;
}

async function downloadGif(exercise) {
  const dest = path.join(GIF_DIR, `${exercise.exerciseId}.gif`);
  try {
    await access(dest);
    return "skipped";
  } catch {}

  const res = await fetchWithRetry(exercise.gifUrl);
  if (!res.ok) throw new Error(`${res.status} ${exercise.gifUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return "downloaded";
}

async function runPool(items, worker, concurrency) {
  let i = 0;
  let done = 0;
  const results = { downloaded: 0, skipped: 0, failed: 0 };

  async function next() {
    while (i < items.length) {
      const item = items[i++];
      try {
        const outcome = await worker(item);
        results[outcome]++;
      } catch (err) {
        results.failed++;
        console.error(`\nEchec ${item.exerciseId}: ${err.message}`);
      }
      done++;
      process.stdout.write(`\rGIFs traités : ${done}/${items.length}`);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, next));
  console.log();
  return results;
}

async function main() {
  await mkdir(GIF_DIR, { recursive: true });

  console.log("Récupération de la liste des exercices...");
  const exercises = await fetchAllExercises();

  await writeFile(
    path.join(OUT_DIR, "exercises.json"),
    JSON.stringify(exercises, null, 2)
  );
  console.log(`Métadonnées écrites dans ${path.join(OUT_DIR, "exercises.json")}`);

  console.log("Téléchargement des GIFs...");
  const results = await runPool(exercises, downloadGif, CONCURRENCY);

  console.log(
    `Terminé. ${results.downloaded} téléchargés, ${results.skipped} déjà présents, ${results.failed} échecs.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
