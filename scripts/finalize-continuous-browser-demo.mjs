import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static");
const root = resolve(import.meta.dirname, "..");
const videoDir = resolve(root, "dist/video");
const manifest = JSON.parse(await readFile(resolve(videoDir, "continuous-recording-manifest.json"), "utf8"));
const mainPath = resolve(root, "submission-assets/openpatch-continuous-main.webm");
const popupOnePath = resolve(root, "submission-assets/openpatch-continuous-popup-1.webm");
const popupTwoPath = resolve(root, "submission-assets/openpatch-continuous-popup-2.webm");
const narrationPath = resolve(videoDir, "openpatch-live-demo-narration.wav");
const stagedPath = resolve(videoDir, "openpatch-continuous-final.mp4");
const namedPath = resolve(root, "submission-assets/openpatch-live-walkthrough.mp4");
const finalPath = resolve(root, "submission-assets/openpatch-demo.mp4");
const contactSheetPath = resolve(videoDir, "openpatch-continuous-contact-sheet.png");
await mkdir(videoDir, { recursive: true });

const seconds = (milliseconds) => (Number(milliseconds) / 1000).toFixed(3);
const [firstOverlay, secondOverlay] = manifest.overlays;
const filter = [
  "[1:v]crop=390:844:0:0,scale=390:844,format=yuv420p[p1]",
  `[0:v][p1]overlay=x=W-w-24:y=10:enable='between(t,${seconds(firstOverlay.startMs)},${seconds(firstOverlay.endMs)})'[v1]`,
  "[2:v]crop=390:844:0:0,scale=390:844,format=yuv420p[p2]",
  `[v1][p2]overlay=x=W-w-24:y=10:enable='between(t,${seconds(secondOverlay.startMs)},${seconds(secondOverlay.endMs)})'[v]`,
  "[3:a]loudnorm=I=-16:TP=-1.5:LRA=11[a]"
].join(";");

await run(ffmpegPath, [
  "-hide_banner", "-loglevel", "error", "-y",
  "-ss", seconds(manifest.trimMs.main), "-i", mainPath,
  "-ss", seconds(manifest.trimMs.popupOne), "-i", popupOnePath,
  "-ss", seconds(manifest.trimMs.popupTwo), "-i", popupTwoPath,
  "-i", narrationPath,
  "-filter_complex", filter,
  "-map", "[v]", "-map", "[a]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18",
  "-pix_fmt", "yuv420p", "-r", "30",
  "-c:a", "aac", "-b:a", "192k",
  "-movflags", "+faststart", "-t", seconds(manifest.durationMs),
  stagedPath
], { maxBuffer: 16 * 1024 * 1024 });

await copyFile(stagedPath, namedPath);
await copyFile(stagedPath, finalPath);
await run(ffmpegPath, [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", finalPath,
  "-vf", "fps=1/10,scale=380:-1,tile=4x3:padding=8:margin=8:color=0x0b2018",
  "-frames:v", "1", contactSheetPath
], { maxBuffer: 8 * 1024 * 1024 });

const bytes = await readFile(finalPath);
const fileStat = await stat(finalPath);
const sha256 = createHash("sha256").update(bytes).digest("hex").toUpperCase();
console.log(`Final continuous video: ${finalPath}`);
console.log(`Named copy: ${namedPath}`);
console.log(`Bytes: ${fileStat.size}`);
console.log(`SHA-256: ${sha256}`);
console.log(`Contact sheet: ${contactSheetPath}`);
