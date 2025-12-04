import React, { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Camera,
  CameraOff,
  Fingerprint,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";

const API_BASE = "http://localhost:3001";

type Status = "Đúng giờ" | "Đi muộn" | "Vắng";

interface MyAttendanceRecord {
  id?: number;
  employee_id?: number;
  date?: string;
  status?: string | null;

  // Thêm các field trả về từ API để lấy tên NV
  MANV?: string;
  HONV?: string;
  TENNV?: string;
}

export default function MyAttendance() {
  const auth = useAuth();
  const user = auth.user as any;
  const employee = (user?.employee as any) || (auth as any).employee || null;
  const navigate = useNavigate();

  const [today, setToday] = useState<string>("");
  const [currentRecord, setCurrentRecord] = useState<MyAttendanceRecord | null>(
    null
  );
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Camera
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Face recognition
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [checkingDescriptor, setCheckingDescriptor] = useState(false);
  const [hasDescriptor, setHasDescriptor] = useState<boolean | null>(null);
  const [storedDescriptor, setStoredDescriptor] = useState<Float32Array | null>(
    null
  );
  const [markingByFace, setMarkingByFace] = useState(false);

  // ======= MÃ NHÂN VIÊN: chỉ lấy từ MANV, không dùng username =======
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

  // Tên hiển thị ưu tiên: record -> employee -> fullName -> MANV
  const displayName =
    (currentRecord &&
      `${currentRecord.HONV ?? ""} ${currentRecord.TENNV ?? ""}`.trim()) ||
    (employee &&
      `${employee.HONV ?? ""} ${employee.TENNV ?? ""}`.trim()) ||
    user?.fullName ||
    manv ||
    "Không rõ";

  /* ---------------------------
     Helper: load face-api models
  ---------------------------- */
  const loadFaceModels = async () => {
    try {
      if (modelsLoaded) return;

      const MODEL_URL = "/models"; // public/models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error("Lỗi load model face-api:", err);
      setError(
        "Không tải được model nhận diện khuôn mặt. Vui lòng thử lại hoặc liên hệ kỹ thuật."
      );
    }
  };

  /* ---------------------------
     useEffect: set hôm nay
  ---------------------------- */
  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setToday(`${yyyy}-${mm}-${dd}`);
  }, []);

  /* ------------------------------------------------
     useEffect: tải chấm công hôm nay của nhân viên
  ------------------------------------------------- */
  useEffect(() => {
    const fetchTodayAttendance = async () => {
      if (!manv) return;

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_BASE}/api/attendance/my-today?manv=${encodeURIComponent(
            manv
          )}`
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Không lấy được dữ liệu chấm công.");
        }

        const data: MyAttendanceRecord = await res.json();
        setCurrentRecord(data);
        setCurrentStatus(data.status || "Chưa chấm");
      } catch (err: any) {
        console.error("Lỗi lấy chấm công hôm nay:", err);
        setError(err.message || "Không lấy được dữ liệu chấm công hôm nay.");
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAttendance();
  }, [manv]);

  /* ------------------------------------------------
     useEffect: load model + kiểm tra đã đăng ký
  ------------------------------------------------- */
  useEffect(() => {
    const checkDescriptor = async () => {
      if (!manv) return;

      setCheckingDescriptor(true);
      setError(null);

      try {
        await loadFaceModels();

        const res = await fetch(
          `${API_BASE}/api/employees/${encodeURIComponent(
            manv
          )}/face-descriptor`
        );

        if (res.status === 404) {
          // Backend trả 404 nếu chưa đăng ký hoặc dữ liệu lỗi và đã reset
          setHasDescriptor(false);
          setStoredDescriptor(null);

          const data = await res.json().catch(() => ({}));
          setError(
            data.error ||
              "Bạn chưa đăng ký mẫu khuôn mặt. Hãy đăng ký khuôn mặt trước khi chấm công bằng nhận diện."
          );
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || "Không lấy được mẫu khuôn mặt từ máy chủ."
          );
        }

        const data = await res.json();
        if (!data.descriptor || !Array.isArray(data.descriptor)) {
          setHasDescriptor(false);
          setError(
            "Dữ liệu mẫu khuôn mặt không hợp lệ. Vui lòng đăng ký lại khuôn mặt."
          );
          return;
        }

        const desc = new Float32Array(data.descriptor);
        setStoredDescriptor(desc);
        setHasDescriptor(true);
      } catch (err: any) {
        console.error("Lỗi khi lấy descriptor:", err);
        if (hasDescriptor === null) {
          setError(
            err.message || "Không kiểm tra được trạng thái đăng ký khuôn mặt."
          );
        }
      } finally {
        setCheckingDescriptor(false);
      }
    };

    checkDescriptor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manv]);

  /* ------------------------------------------------
     useEffect: gán stream vào <video> khi cameraOn
  ------------------------------------------------- */
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      // @ts-ignore
      video.srcObject = streamRef.current;

      video
        .play()
        .catch((err) => {
          console.error("Không play được video:", err);
          setError("Không hiển thị được hình ảnh camera.");
        });
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
      setError("Không mở được camera. Vui lòng kiểm tra quyền truy cập.");
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
     Đánh dấu chấm công (gọi API)
  ---------------------------- */
  const markToday = async (status: Status) => {
    if (!manv) {
      setError(
        "Không xác định được mã nhân viên (MANV). Vui lòng kiểm tra lại tài khoản."
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`${API_BASE}/api/attendance/mark-today`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manv, status }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không chấm công được.");
      }

      const data = await res.json();
      setSuccessMsg(
        `Đã chấm công hôm nay (${data.status}). Mã NV: ${data.manv}.`
      );
      setCurrentStatus(data.status);

      // Refresh lại record
      const ref = await fetch(
        `${API_BASE}/api/attendance/my-today?manv=${encodeURIComponent(manv)}`
      );
      if (ref.ok) {
        const rec: MyAttendanceRecord = await ref.json();
        setCurrentRecord(rec);
      }
    } catch (err: any) {
      console.error("Lỗi chấm công:", err);
      setError(err.message || "Không chấm công được. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------
     So sánh 2 descriptor
  ---------------------------- */
  const computeDistance = (a: Float32Array, b: Float32Array): number => {
    if (a.length !== b.length) return Number.POSITIVE_INFINITY;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = a[i] - b[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  };

  /* ---------------------------
     Chấm công bằng khuôn mặt
  ---------------------------- */
  const handleMarkByFace = async () => {
    if (!modelsLoaded) {
      setError("Model nhận diện chưa sẵn sàng. Vui lòng thử lại sau.");
      return;
    }
    if (!storedDescriptor || !hasDescriptor) {
      setError(
        "Bạn chưa đăng ký mẫu khuôn mặt hoặc dữ liệu bị thiếu. Hãy đăng ký lại."
      );
      return;
    }
    if (!cameraOn || !videoRef.current) {
      setError("Vui lòng bật camera trước khi chấm công bằng khuôn mặt.");
      return;
    }

    try {
      setMarkingByFace(true);
      setError(null);
      setSuccessMsg(null);

      const video = videoRef.current;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError(
          "Không phát hiện được khuôn mặt. Vui lòng đưa mặt vào giữa khung hình và thử lại."
        );
        return;
      }

      const currentDesc = detection.descriptor;
      const distance = computeDistance(storedDescriptor, currentDesc);

      const THRESHOLD = 0.5;

      if (distance > THRESHOLD) {
        setError(
          `Khuôn mặt không khớp với mẫu đã đăng ký (khoảng cách ${distance.toFixed(
            3
          )}). Vui lòng thử lại hoặc kiểm tra lại mẫu đăng ký.`
        );
        return;
      }

      await markToday("Đúng giờ");
    } catch (err: any) {
      console.error("Lỗi nhận diện khuôn mặt:", err);
      setError(err.message || "Không chấm công bằng khuôn mặt được.");
    } finally {
      setMarkingByFace(false);
    }
  };

  // Dừng camera khi unmount
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
          <span>Bạn chưa đăng nhập. Vui lòng đăng nhập để chấm công.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarClock className="text-blue-600" size={28} />
        <div>
          <h1 className="text-xl font-semibold">Chấm công hôm nay</h1>
          <p className="text-sm text-gray-500">
            Nhân viên:{" "}
            <span className="font-medium">{displayName}</span> • Mã NV:{" "}
            <span className="font-medium">{manv || "Không rõ"}</span> • Ngày:{" "}
            <span className="font-medium">{today}</span>
          </p>
        </div>
      </div>

      {/* Thông tin trạng thái hiện tại */}
      <div className="rounded-xl border bg-white p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Trạng thái chấm công hôm nay</p>
          <p className="text-lg font-semibold">
            {loading ? "Đang tải..." : currentStatus || "Chưa chấm"}
          </p>
          {currentRecord?.date && (
            <p className="text-xs text-gray-400 mt-1">
              Mã bản ghi: {currentRecord.id} • Ngày: {currentRecord.date}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 text-xs text-gray-500">
          <span>
            • Bạn chỉ có thể chấm công bằng{" "}
            <span className="font-semibold">khuôn mặt</span>.
          </span>
          <span>
            • Nếu chưa đăng ký khuôn mặt, hãy nhấn{" "}
            <span className="font-semibold">“Đăng ký khuôn mặt ngay”</span> ở
            khung bên phải.
          </span>
        </div>
      </div>

      {/* Khu vực camera + thông báo */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Camera */}
        <div className="rounded-xl border bg-gray-900/90 p-4 text-white flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera size={20} />
              <span className="font-semibold">Camera nhận diện</span>
            </div>
            {cameraOn ? (
              <button
                onClick={handleStopCamera}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs bg-red-500 hover:bg-red-600"
              >
                <CameraOff size={14} />
                Tắt camera
              </button>
            ) : (
              <button
                onClick={handleStartCamera}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-600"
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

          <button
            onClick={handleMarkByFace}
            disabled={
              markingByFace ||
              saving ||
              !modelsLoaded ||
              !hasDescriptor ||
              checkingDescriptor
            }
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Fingerprint size={16} />
            {markingByFace
              ? "Đang nhận diện khuôn mặt..."
              : "Chấm công bằng khuôn mặt"}
          </button>

          {!modelsLoaded && (
            <p className="mt-1 text-xs text-yellow-300">
              Model nhận diện đang tải. Vui lòng đợi vài giây trước khi chấm
              công bằng khuôn mặt.
            </p>
          )}

          {hasDescriptor === false && (
            <p className="mt-1 text-xs text-red-300">
              Bạn chưa đăng ký mẫu khuôn mặt.
            </p>
          )}
        </div>

        {/* Cột bên phải: lỗi / thành công + nút đăng ký khuôn mặt */}
        <div className="space-y-4">
          {(error || successMsg) && (
            <div className="rounded-xl border bg-white p-4 space-y-3">
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle size={18} />
                  <div className="space-y-2">
                    <p>{error}</p>
                    {error.toLowerCase().includes("khuôn mặt") && (
                      <button
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() =>
                          navigate("/face-register", {
                            state: { from: "my-attendance" },
                          })
                        }
                      >
                        <Fingerprint size={14} />
                        Đăng ký khuôn mặt ngay
                      </button>
                    )}
                  </div>
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
      </div>
    </div>
  );
}
