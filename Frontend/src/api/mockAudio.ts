const clamp16 = (value: number) => Math.max(-32768, Math.min(32767, value));

const writeString = (view: DataView, offset: number, stringValue: string) => {
  for (let index = 0; index < stringValue.length; index += 1) {
    view.setUint8(offset + index, stringValue.charCodeAt(index));
  }
};

const createWavBlob = (samples: Float32Array, sampleRate: number) => {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);

  let offset = 44;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = clamp16(samples[index] * 32767);
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

export const createControllerAudioUrl = (text: string) => {
  if (typeof window === 'undefined') {
    return '';
  }

  const sampleRate = 22050;
  const durationSeconds = 0.72;
  const totalSamples = Math.round(sampleRate * durationSeconds);
  const hash = Array.from(text).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const baseFrequencies = [280, 320, 360, 420];
  const primaryFrequency = baseFrequencies[hash % baseFrequencies.length];
  const accentFrequency = baseFrequencies[(hash + 2) % baseFrequencies.length] + 110;
  const samples = new Float32Array(totalSamples);

  for (let index = 0; index < totalSamples; index += 1) {
    const t = index / sampleRate;
    const progress = index / totalSamples;
    const envelope = Math.sin(Math.PI * Math.min(1, progress / 0.12)) * Math.sin(Math.PI * Math.min(1, (1 - progress) / 0.16));
    const carrier = Math.sin(2 * Math.PI * primaryFrequency * t) * 0.14;
    const accent = Math.sin(2 * Math.PI * accentFrequency * t) * 0.06;
    const pulse = progress > 0.58 ? Math.sin(2 * Math.PI * 95 * t) * 0.035 : 0;
    samples[index] = (carrier + accent + pulse) * envelope;
  }

  const blob = createWavBlob(samples, sampleRate);
  return URL.createObjectURL(blob);
};
