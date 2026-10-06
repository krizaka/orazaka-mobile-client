/** Wave-visualizer palette + seed health metrics for the dashboard. */
export const PALETTE = [
  "hsl(200, 90%, 55%)",
  "hsl(220, 80%, 60%)",
  "hsl(260, 70%, 55%)",
  "hsl(180, 75%, 50%)",
  "hsl(300, 60%, 55%)",
];

export interface WaveData {
  entropy: number;
  stability: number;
  label: string;
}

export const BASE_WAVES: WaveData[] = [
  { entropy: 0.82, stability: 0.91, label: "Pipeline" },
  { entropy: 0.45, stability: 0.97, label: "Identity" },
  { entropy: 0.67, stability: 0.88, label: "Tools" },
  { entropy: 0.23, stability: 0.99, label: "Cache" },
  { entropy: 0.56, stability: 0.93, label: "Router" },
];
