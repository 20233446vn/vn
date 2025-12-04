// Client/components/faceApiHelper.ts
import * as faceapi from "face-api.js";

let modelsLoaded = false;

/**
 * Load các model của face-api.js (chỉ load 1 lần)
 * - TinyFaceDetector: phát hiện mặt
 * - FaceLandmark68Net: landmark 68 điểm
 * - FaceRecognitionNet: descriptor 128 chiều
 */
export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;

  // Nếu bạn dùng model trong thư mục public/models:
  const MODEL_URL = "/models";

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
}

/**
 * Tính khoảng cách Euclidean giữa 2 vector descriptor
 * (dùng để so khớp khuôn mặt)
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return Infinity;

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Export faceapi để component khác dùng
export { faceapi };
