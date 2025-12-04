import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  CameraOff,
  Save,
  AlertCircle,
  CheckCircle2,
  UserCircle2,
} from "lucide-react";
import * as faceapi from "face-api.js";

const API_BASE = "http://localhost:3001";

interface LocationState {
  from?: string;
}

export default function FaceRegister() {
  const auth = useAuth();
  const user = auth.user as any;
  const employee = (user?.employee as any) || (auth as any).employee || null;

  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ======= MÃ NHÂN VIÊN: chỉ lấy từ MANV, KHÔNG dùng username =======
  const manv: string =
    (
      employee?.MANV ??
      employee?.manv ??
      employee?.MaNV ??
      user?.MaNV ??
      user?.manv ??
      ""
    )
      .toString()
      .trim()
      .toUpperCase();

  /* ---------------------------
     Load model face-api
  ---------------------------- */
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Lỗi load model:", err);
        setError(
          "Không tải được model nhận diện. Vui lòng tải lại trang hoặc liên hệ kỹ thuật."
        );
      }
    };

    loadModels();
  }, []);

  /* ---------------------------
     Gán stream vào video
  ---------------------------- */
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      // @ts-ignore
      video.srcObject = streamRef.current;
      video
        .play()
        .catch((err) => console.error("Không play video:", err));
    }
  }, [cameraOn]);

  /* ---------------------------
     Bật / tắt camera
  ---------------------------- */
  const handleStartCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Trình duyệt không hỗ trợ camera.");
      return;
    }

    try {
      setError(null);
      setSuccessMsg(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch (err) {
      console.error(err);
      setError("Không mở được camera. Vui lòng kiểm tra quyền.");
    }
  };

  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  /* ---------------------------
     Đăng ký mẫu khuôn mặt
  ---------------------------- */
  const handleRegisterFace = async () => {
    if (!user || !manv) {
      setError(
        "Không xác định được mã nhân viên (MANV). Vui lòng đăng nhập lại hoặc kiểm tra tài khoản."
      );
      return;
    }
    if (!modelsLoaded) {
      setError("Model nhận diện chưa sẵn sàng. Vui lòng đợi trong giây lát.");
      return;
    }
    if (!cameraOn || !videoRef.current) {
      setError(
        "Vui lòng bật camera và đảm bảo khuôn mặt nằm trong khung hình."
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const video = videoRef.current;

      // Phát hiện 1 khuôn mặt + descriptor
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError(
          "Không phát hiện được khuôn mặt. Hãy tiến lại gần hơn, nhìn thẳng vào camera và thử lại."
        );
        return;
      }

      const descriptorArray = Array.from(detection.descriptor);

      // Gửi lên server
      const res = await fetch(
        `${API_BASE}/api/employees/${encodeURIComponent(manv)}/face-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            descriptor: descriptorArray,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        const msg = data?.error || "Không lưu được mẫu khuôn mặt.";

        if (msg.includes("Không tìm thấy nhân viên")) {
          setError(
            `Không tìm thấy nhân viên với mã "${manv}". Hãy kiểm tra lại bảng employees xem có MANV = "${manv}" hay không.`
          );
        } else {
          setError(msg);
        }
        return;
      }

      setSuccessMsg("Đăng ký mẫu khuôn mặt thành công.");

      // Nếu đi từ màn chấm công thì tự quay lại
      if (state.from === "my-attendance") {
        setTimeout(() => {
          navigate("/my-attendance");
        }, 1500);
      }
    } catch (err: any) {
      console.error("Lỗi đăng ký khuôn mặt:", err);
      setError(err.message || "Không đăng ký được mẫu khuôn mặt.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------
     unmount: dừng camera
  ---------------------------- */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  if (!user) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={20} />
          <span>Bạn cần đăng nhập để đăng ký khuôn mặt.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserCircle2 className="text-blue-600" size={30} />
        <div>
          <h1 className="text-xl font-semibold">Đăng ký khuôn mặt</h1>
          <p className="text-sm text-gray-500">
            Mã nhân viên:{" "}
            <span className="font-semibold">{manv || "Không rõ"}</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-4">
        {/* Hướng dẫn */}
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Đảm bảo môi trường đủ sáng, khuôn mặt nhìn thẳng vào camera.</p>
          <p>• Không che mặt bằng khẩu trang, kính đen, mũ lưỡi trai...</p>
          <p>
            • Sau khi đăng ký thành công, bạn có thể dùng khuôn mặt để chấm
            công.
          </p>
        </div>

        {/* Camera */}
        <div className="rounded-xl bg-gray-900/90 text-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera size={20} />
              <span className="font-semibold text-sm">Camera</span>
            </div>

            {cameraOn ? (
              <button
                onClick={handleStopCamera}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-red-500 hover:bg-red-600"
              >
                <CameraOff size={14} />
                Tắt camera
              </button>
            ) : (
              <button
                onClick={handleStartCamera}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-600"
              >
                <Camera size={14} />
                Mở camera
              </button>
            )}
          </div>

          <div className="mt-2 w-full aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
            {cameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-400">
                Camera đang tắt. Bấm{" "}
                <span className="font-semibold">Mở camera</span> để bắt đầu.
              </span>
            )}
          </div>

          {!modelsLoaded && (
            <p className="mt-1 text-xs text-yellow-300">
              Đang tải model nhận diện khuôn mặt, vui lòng đợi...
            </p>
          )}
        </div>

        {/* Nút đăng ký */}
        <button
          onClick={handleRegisterFace}
          disabled={saving || !cameraOn || !manv}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {saving ? "Đang lưu mẫu khuôn mặt..." : "Lưu mẫu khuôn mặt"}
        </button>
      </div>

      {(error || successMsg) && (
        <div className="rounded-xl border bg-white p-4 space-y-3">
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertCircle size={18} />
              <p className="whitespace-pre-line">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2 text-sm text-emerald-600">
              <CheckCircle2 size={18} />
              <p>{successMsg}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
