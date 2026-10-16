#!/usr/bin/env node
/**
 * Records the real Orazaka app on the booted iOS simulator and cuts it into the clips of the site.
 *
 *   node scripts/record-story.mjs --appearance dark|light --out <dir> [--video]
 *
 * What it does, nothing more: set the simulator's appearance and status bar, start `simctl io recordVideo`, run
 * `.maestro/story.yaml` (which reports named moments to a local marker server), stop, then cut with ffmpeg — the
 * typing between `type:start`/`type:end` is played 4x, every wait between `wait:start`/`wait:end` is replaced by a
 * short hold of the screen carrying a label that says how long was cut. Frames are the app's, untouched.
 *
 * Credentials come from the QA file through secret.sh (never printed); the app talks to the platform it was built for
 * (EXPO_PUBLIC_EDGE_URL). Hold the heavy lock around it: `heavy-lock.sh acquire oramobile`.
 */
import { spawn, execFileSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
};
const appearance = arg("appearance", "dark");
const out = path.resolve(arg("out", "recordings"));
const withVideo = process.argv.includes("--video");
const SPEED = 4;
const HOLD = 1.4;
const secret = (key) =>
  execFileSync(path.join(os.homedir(), ".krizaka-worktrees/tools/secret.sh"), [path.join(os.homedir(), "Documents/krizaka/qa.env"), key], { encoding: "utf8" });

fs.mkdirSync(out, { recursive: true });
const raw = path.join(out, `raw-${appearance}.mp4`);
const marks = [];

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  marks.push({ name: url.searchParams.get("name") ?? "", label: url.searchParams.get("label") ?? "", t: Date.now() / 1000 });
  res.end("ok");
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const markUrl = `http://127.0.0.1:${server.address().port}`;

execFileSync("xcrun", ["simctl", "ui", "booted", "appearance", appearance]);
execFileSync("xcrun", ["simctl", "status_bar", "booted", "override", "--time", "9:41", "--batteryState", "charged", "--batteryLevel", "100", "--cellularBars", "4", "--wifiBars", "3"]);

const recorder = spawn("xcrun", ["simctl", "io", "booted", "recordVideo", "--codec", "h264", "--force", raw], { stdio: "ignore" });
const startedAt = Date.now() / 1000;
await new Promise((r) => setTimeout(r, 2500));

const env = {
  ...process.env,
  MARK_URL: markUrl,
  ORAZAKA_EMAIL: secret("ORAZAKA_USER_EMAIL"),
  ORAZAKA_PASSWORD: secret("ORAZAKA_USER_PASSWORD"),
};
const args = [
  "test", ".maestro/story.yaml",
  "-e", `MARK_URL=${markUrl}`,
  "-e", `ORAZAKA_EMAIL=${env.ORAZAKA_EMAIL}`,
  "-e", `ORAZAKA_PASSWORD=${env.ORAZAKA_PASSWORD}`,
  "-e", `IMAGE_PROMPT=${arg("image-prompt", "A ceramic table lamp on a walnut desk, warm evening light, product photograph")}`,
  "-e", `VIDEO_PROMPT=${arg("video-prompt", "Slow push-in on a ceramic lamp being switched on in a quiet studio, warm light spreading across the wall")}`,
  "-e", `IMAGE_MODEL=${arg("image-model", "stable-diffusion-3.5-large")}`,
  "-e", `CHAT_PROMPT=${arg("chat-prompt", "Draft a short, polite reply to a customer whose lamp arrived late.")}`,
  "-e", `WITH_VIDEO=${withVideo}`,
];
const code = await new Promise((resolve) => spawn("maestro", args, { stdio: "inherit" }).on("exit", resolve));
await new Promise((r) => setTimeout(r, 1500));
recorder.kill("SIGINT");
await new Promise((r) => recorder.on("exit", r));
server.close();
execFileSync("xcrun", ["simctl", "status_bar", "booted", "clear"]);
fs.writeFileSync(path.join(out, `marks-${appearance}.json`), JSON.stringify({ startedAt, marks }, null, 2));
if (code !== 0) {
  console.error(`maestro exited with ${code}; raw recording kept at ${raw}`);
  process.exit(code ?? 1);
}

// ---- cutting -------------------------------------------------------------------------------------------------------
const at = (name, from = 0) => marks.find((m, i) => i >= from && m.name === name);
const offset = (m) => Math.max(0, m.t - startedAt - 0.4); // simctl's first frame lags the process start a little
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "json", raw], { encoding: "utf8" })).streams[0];
console.log(`raw recording ${probe.width}x${probe.height} @ ${probe.r_frame_rate}`);

const clips = ["sign-in", "studio-run", "ask", "jobs"];
for (const id of clips) {
  const s = marks.findIndex((m) => m.name === `clip:${id}:start`);
  const e = marks.findIndex((m) => m.name === `clip:${id}:end`);
  if (s === -1 || e === -1) throw new Error(`no marks for ${id}`);
  const t0 = offset(marks[s]);
  const t1 = offset(marks[e]);
  // Pieces between t0 and t1: normal, typing (sped up), wait (cut → hold).
  const pieces = [];
  let cursor = t0;
  for (let i = s + 1; i < e; i++) {
    const m = marks[i];
    if (m.name === "type:start" || m.name === "wait:start") {
      const endName = m.name === "type:start" ? "type:end" : "wait:end";
      const j = marks.findIndex((x, k) => k > i && x.name === endName);
      if (j === -1 || j > e) continue;
      pieces.push({ kind: "normal", a: cursor, b: offset(m) });
      pieces.push({ kind: m.name === "type:start" ? "type" : "wait", a: offset(m), b: offset(marks[j]), label: m.label });
      cursor = offset(marks[j]);
      i = j;
    }
  }
  pieces.push({ kind: "normal", a: cursor, b: t1 });
  const parts = [];
  const filters = [];
  pieces.filter((p) => p.b - p.a > 0.05).forEach((p, n) => {
    const v = `v${n}`;
    if (p.kind === "normal") filters.push(`[0:v]trim=start=${p.a}:end=${p.b},setpts=PTS-STARTPTS,fps=60[${v}]`);
    else if (p.kind === "type") filters.push(`[0:v]trim=start=${p.a}:end=${p.b},setpts=(PTS-STARTPTS)/${SPEED},fps=60[${v}]`);
    else {
      const cut = Math.round(p.b - p.a);
      const text = `${p.label ? `${p.label} - ` : ""}${cut} s cut`.replace(/'/g, "");
      filters.push(
        `[0:v]trim=start=${p.a}:end=${p.a + 0.05},setpts=PTS-STARTPTS,loop=loop=${Math.round(HOLD * 60)}:size=1:start=0,fps=60,` +
          `drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:text='${text}':fontsize=h/46:fontcolor=white:box=1:boxcolor=black@0.62:boxborderw=14:x=(w-text_w)/2:y=h*0.08[${v}]`,
      );
    }
    parts.push(`[${v}]`);
  });
  const graph = `${filters.join(";")};${parts.join("")}concat=n=${parts.length}:v=1:a=0,scale=720:1566:flags=lanczos,format=yuv420p[out]`;
  const base = path.join(out, `clip-${id}-${appearance}`);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", raw, "-filter_complex", graph, "-map", "[out]", "-r", "60", "-c:v", "libx264", "-crf", "20", "-preset", "slow", "-movflags", "+faststart", `${base}.mp4`]);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", `${base}.mp4`, "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1", `${base}.webm`]);
  execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", "1.2", "-i", `${base}.mp4`, "-frames:v", "1", `${base}-poster.webp`]);
  console.log(`clip-${id}-${appearance}: ${pieces.length} pieces`);
}
