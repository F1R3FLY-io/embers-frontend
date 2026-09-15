import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/**
 * Turns the capture run's recordings into animated GIFs for the usage guide.
 *
 * Recordings come out of Playwright as WebM at the capture viewport. A GIF is
 * what a README can actually show, so each is re-encoded at a reduced frame
 * rate and width — a documentation illustration does not need sixty frames a
 * second, and every frame is a fresh palette in this format.
 *
 * Two encoders, in order of preference. `gifski` quantises across the whole
 * clip and produces a markedly smaller file at the same legibility; ffmpeg's
 * two-pass palette route is the fallback, so a machine without gifski still
 * produces usable output rather than nothing.
 *
 * Size is a hard constraint rather than an aspiration: a documentation image
 * that takes a visible moment to load will not be looked at. Anything over the
 * budget is re-encoded at a lower setting, and if that still does not fit the
 * script fails NAMING the journey, so the answer is "shorten that journey"
 * rather than "the build broke".
 */

const VIDEO_DIR = "video";
const OUTPUT_DIR = "../docs/usage/media/journeys";
const MAX_BYTES = 5 * 1024 * 1024;

/** Encoding settings, tried in order until one fits the budget. */
const PROFILES = [
  { fps: 12, quality: 80, width: 960 },
  { fps: 10, quality: 70, width: 800 },
  { fps: 8, quality: 60, width: 640 },
];

async function have(command) {
  try {
    await run(command, ["--version"]);
    return true;
  } catch {
    return false;
  }
}

/** Explodes a clip into PNG frames, which is what gifski consumes. */
async function extractFrames(source, directory, { fps, width }) {
  await run("ffmpeg", [
    "-loglevel",
    "error",
    "-i",
    source,
    "-vf",
    `fps=${String(fps)},scale=${String(width)}:-1:flags=lanczos`,
    join(directory, "frame-%05d.png"),
  ]);
  return (await readdir(directory))
    .filter((name) => name.endsWith(".png"))
    .sort()
    .map((name) => join(directory, name));
}

async function encodeWithGifski(source, destination, profile) {
  const workspace = await mkdtemp(join(tmpdir(), "embers-gif-"));
  try {
    const frames = await extractFrames(source, workspace, profile);
    if (frames.length === 0) {
      throw new Error(`no frames were extracted from ${source}`);
    }
    await run("gifski", [
      "--output",
      destination,
      "--fps",
      String(profile.fps),
      "--quality",
      String(profile.quality),
      "--width",
      String(profile.width),
      ...frames,
    ]);
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
}

/** The fallback: build a palette from the clip, then map against it. */
async function encodeWithFfmpeg(source, destination, { fps, width }) {
  const workspace = await mkdtemp(join(tmpdir(), "embers-gif-"));
  const palette = join(workspace, "palette.png");
  const filters = `fps=${String(fps)},scale=${String(width)}:-1:flags=lanczos`;
  try {
    await run("ffmpeg", [
      "-loglevel",
      "error",
      "-i",
      source,
      "-vf",
      `${filters},palettegen=stats_mode=diff`,
      palette,
    ]);
    await run("ffmpeg", [
      "-loglevel",
      "error",
      "-y",
      "-i",
      source,
      "-i",
      palette,
      "-lavfi",
      `${filters}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
      destination,
    ]);
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
}

async function main() {
  let recordings;
  try {
    recordings = (await readdir(VIDEO_DIR)).filter((name) =>
      name.endsWith(".webm"),
    );
  } catch {
    process.stderr.write(
      `no recordings in ${VIDEO_DIR}; run the capture project first\n`,
    );
    process.exitCode = 1;
    return;
  }

  if (recordings.length === 0) {
    process.stderr.write(`no recordings in ${VIDEO_DIR}\n`);
    process.exitCode = 1;
    return;
  }

  const useGifski = await have("gifski");
  const encode = useGifski ? encodeWithGifski : encodeWithFfmpeg;
  process.stdout.write(
    `encoding ${String(recordings.length)} recording(s) with ${useGifski ? "gifski" : "ffmpeg"}\n`,
  );

  await mkdir(OUTPUT_DIR, { recursive: true });
  const oversized = [];

  for (const recording of recordings) {
    const source = join(VIDEO_DIR, recording);
    const name = basename(recording, ".webm");
    const destination = join(OUTPUT_DIR, `${name}.gif`);

    let size = Infinity;
    for (const profile of PROFILES) {
      await encode(source, destination, profile);
      ({ size } = await stat(destination));
      if (size <= MAX_BYTES) {
        process.stdout.write(
          `  ${name}.gif  ${(size / 1024 / 1024).toFixed(2)} MiB ` +
            `(${String(profile.width)}px, ${String(profile.fps)} fps)\n`,
        );
        break;
      }
    }

    if (size > MAX_BYTES) {
      oversized.push(`${name} (${(size / 1024 / 1024).toFixed(2)} MiB)`);
    }
  }

  if (oversized.length > 0) {
    // Named, because the fix is to shorten a specific journey rather than to
    // loosen the budget.
    process.stderr.write(
      `these journeys do not fit the ${String(MAX_BYTES / 1024 / 1024)} MiB budget even at the lowest setting:\n` +
        oversized.map((entry) => `  ${entry}\n`).join(""),
    );
    process.exitCode = 1;
  }
}

await main();
