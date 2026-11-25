import test from "node:test";
import assert from "node:assert/strict";
import { pcmToWavBuffer } from "./audio";

test("pcmToWavBuffer writes valid 44-byte RIFF/WAVE header", () => {
  const pcm = Buffer.from([1, 2, 3, 4, 5, 6]);
  const wav = pcmToWavBuffer(pcm, 24000, 1, 16);

  assert.equal(wav.length, 44 + pcm.length);
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.readUInt32LE(4), 36 + pcm.length);
  assert.equal(wav.toString("ascii", 8, 12), "WAVE");
  assert.equal(wav.toString("ascii", 12, 16), "fmt ");
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.toString("ascii", 36, 40), "data");
  assert.equal(wav.readUInt32LE(40), pcm.length);
});
