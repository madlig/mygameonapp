// src/features/requests/utils/priorityEngine.js
// Utility kecil untuk menghitung priority score + label untuk request board.
// Score dihasilkan dari kombinasi requestCount dan estimatedSize (GB).
// Larger estimatedSize tends to reduce immediate priority (candidate for batch),
// while high requestCount increases priority.

export const DEFAULT_CONFIG = {
  weightRequestCount: 0.6,
  weightSize: 0.4,
  sizeBatchThresholdGB: 10, // >= 10GB considered "large" by default
  maxRequestCountNormalizer: 20, // used to normalize requestCount into [0..1]
  maxSizeNormalizerGB: 50, // size beyond this saturates penalty
};

export function computePriority({ requestCount = 0, estimatedSize = 0 } = {}, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // normalize requestCount (0..1)
  const reqNorm = Math.min(Number(requestCount) / cfg.maxRequestCountNormalizer, 1);

  // sizePenalty: large sizes reduce priority.
  // normalize estimatedSize to [0..1] with cfg.maxSizeNormalizerGB as saturation.
  const sizeNorm = Math.min(Number(estimatedSize) / cfg.maxSizeNormalizerGB, 1);
  const sizeScore = 1 - sizeNorm; // smaller size => higher score

  // weighted score
  const score = Math.max(0, Math.min(1, cfg.weightRequestCount * reqNorm + cfg.weightSize * sizeScore));

  // labels thresholds
  let label = "Low";
  if (score >= 0.75) label = "Hot";
  else if (score >= 0.45) label = "Normal";
  else label = "Batch Later";

  // color class for UI
  const colorClass = label === "Hot" ? "bg-red-100 text-red-800" : label === "Normal" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700";

  return { score, label, colorClass, scoreRounded: Math.round(score * 100) / 100 };
}