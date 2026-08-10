import fs from "fs";

const inputFile = "test-input.wav";
const outputFile = "test-stream.wav";

const input = fs.readFileSync(inputFile);

// WAV header
const inputChannels = input.readUInt16LE(22);
const inputSampleRate = input.readUInt32LE(24);
const bitsPerSample = input.readUInt16LE(34);

console.log("Input:");
console.log("Channels:", inputChannels);
console.log("Sample rate:", inputSampleRate);
console.log("Bits:", bitsPerSample);

if (inputChannels !== 2 || inputSampleRate !== 44100 || bitsPerSample !== 16) {
    throw new Error("Unexpected WAV format");
}

// Find the actual PCM data.
// For your current simple WAV, this is normally byte 44.
const pcm = input.subarray(44);

const inputBytesPerSample = 2;
const inputFrameSize = inputChannels * inputBytesPerSample;

const inputFrames = Math.floor(pcm.length / inputFrameSize);

// Target: mono, 16 kHz, 16-bit
const outputSampleRate = 16000;

const outputFrames = Math.floor(
    inputFrames * outputSampleRate / inputSampleRate
);

const outputPcm = Buffer.alloc(outputFrames * 2);

for (let i = 0; i < outputFrames; i++) {
    const sourcePosition =
        i * inputSampleRate / outputSampleRate;

    const sourceIndex = Math.floor(sourcePosition);

    const offset = sourceIndex * inputFrameSize;

    const left = pcm.readInt16LE(offset);
    const right = pcm.readInt16LE(offset + 2);

    // Stereo → mono
    const mono = Math.round((left + right) / 2);

    outputPcm.writeInt16LE(mono, i * 2);
}

// Create WAV header
const header = Buffer.alloc(44);

header.write("RIFF", 0);
header.writeUInt32LE(36 + outputPcm.length, 4);
header.write("WAVE", 8);

header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);              // PCM
header.writeUInt16LE(1, 22);              // mono
header.writeUInt32LE(outputSampleRate, 24);
header.writeUInt32LE(outputSampleRate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);

header.write("data", 36);
header.writeUInt32LE(outputPcm.length, 40);

fs.writeFileSync(
    outputFile,
    Buffer.concat([header, outputPcm])
);

console.log("\nCreated:", outputFile);
console.log("Channels: 1");
console.log("Sample rate: 16000");
console.log("Bits: 16");
console.log("Size:", 44 + outputPcm.length);