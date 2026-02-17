import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 44100;
const PIT_RATE = 1193180;

const TUNE_BUILD_PLAN = [
  { name: "silence", source: "silence", samplesPerSymbol: 240 },
  { name: "got_trophy", source: "got_trophy", samplesPerSymbol: 162 },
  { name: "treasure", source: "treasure", samplesPerSymbol: 162 },
  { name: "nextlevel", source: "nextlevel", samplesPerSymbol: 162 },
  { name: "walking", source: "walking", samplesPerSymbol: 440 },
  { name: "jumping", source: "jumping", samplesPerSymbol: 345 },
  { name: "got_something", source: "got_something", samplesPerSymbol: 162 },
  { name: "explosion", source: "explosion", samplesPerSymbol: 240 },
  { name: "ouch", source: "ouch", samplesPerSymbol: 240 },
  { name: "flying", source: "flying", samplesPerSymbol: 240 },
  { name: "falling", source: "falling", samplesPerSymbol: 240 },
  { name: "tojetpack", source: "tojetpack", samplesPerSymbol: 240 },
  { name: "climbing", source: "walking", samplesPerSymbol: 440 }
];

function invfreqToFreq(invfreq) {
  return PIT_RATE / invfreq;
}

function sqd(phase, freq) {
  if (freq >= 6000) {
    return Math.sin(phase);
  }

  let intensity = 0.001;
  if (freq >= 2000) {
    intensity = 0.1;
  }

  const s = Math.sin(phase);
  return s / Math.sqrt((s * s) + intensity);
}

function decodeSymbolsToPcm16(symbols, samplesPerSymbol) {
  const pcm = [];
  let phase = 0;
  const phaseScale = 2 * Math.PI;

  for (const symbol of symbols) {
    if (symbol === 0xffff) {
      break;
    }

    if (symbol === 0x0000) {
      for (let i = 0; i < samplesPerSymbol; i += 1) {
        pcm.push(0);
      }
      phase = 0;
      continue;
    }

    const freq = invfreqToFreq(symbol);
    const dPhase = (phaseScale * freq) / SAMPLE_RATE;

    for (let i = 0; i < samplesPerSymbol; i += 1) {
      const sig = (sqd(phase, freq) * 5000) + 5000;
      const sample = Math.max(-32768, Math.min(32767, Math.round(sig)));
      pcm.push(sample);
      phase += dPhase;
      if (phase >= phaseScale) {
        phase %= phaseScale;
      }
    }
  }

  return Int16Array.from(pcm);
}

function loadSymbolArrays(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid symbol data format");
  }

  const map = new Map();
  for (const [name, value] of Object.entries(raw)) {
    if (!Array.isArray(value)) {
      continue;
    }
    map.set(name, value.map((entry) => Number(entry)));
  }
  return map;
}

function encodeWavMono16(samples, sampleRate) {
  const dataSize = samples.length * 2;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;
  const out = Buffer.alloc(totalSize);

  out.write("RIFF", 0);
  out.writeUInt32LE(totalSize - 8, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(sampleRate, 24);
  out.writeUInt32LE(sampleRate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    out.writeInt16LE(samples[i], headerSize + (i * 2));
  }

  return out;
}

function main() {
  const scriptPath = fileURLToPath(import.meta.url);
  const scriptsRoot = path.dirname(scriptPath);
  const jsRoot = path.resolve(scriptsRoot, "..");
  const sourcePath = path.join(scriptsRoot, "sfx-symbols.json");
  const outDir = path.join(jsRoot, "public", "audio");

  const arrays = loadSymbolArrays(sourcePath);
  fs.mkdirSync(outDir, { recursive: true });

  const manifest = {};

  for (const tune of TUNE_BUILD_PLAN) {
    const symbols = arrays.get(tune.source);
    if (!symbols) {
      throw new Error(`Missing source array '${tune.source}' in scripts/sfx-symbols.json`);
    }

    const pcm = decodeSymbolsToPcm16(symbols, tune.samplesPerSymbol);
    const wav = encodeWavMono16(pcm, SAMPLE_RATE);
    const outPath = path.join(outDir, `${tune.name}.wav`);
    fs.writeFileSync(outPath, wav);

    manifest[tune.name] = {
      source: tune.source,
      samplesPerSymbol: tune.samplesPerSymbol,
      samples: pcm.length,
      seconds: Number((pcm.length / SAMPLE_RATE).toFixed(3))
    };
  }

  const manifestPath = path.join(outDir, "manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(`Generated ${TUNE_BUILD_PLAN.length} audio files at ${outDir}`);
}

main();
