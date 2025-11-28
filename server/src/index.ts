import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import * as path from "path";
import multer from "multer";
import { db, testConnection } from "./config/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

/* -----------------------------------------------------
   MIDDLEWARE & CONFIG
------------------------------------------------------ */

// Cấu hình lưu file avatar nhân viên
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, "../uploads/avatars"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Helper bắt lỗi async
function asyncHandler(
  fn: (req: express.Request, res: express.Response) => Promise<any>
) {
  return (req: express.Request, res: express.Response) => {
    fn(req, res).catch((err) => {
      console.error("API error:", err);
      res.status(500).json({ error: "Lỗi hệ thống, vui lòng thử lại sau." });
    });
  };
}

/* -----------------------------------------------------
   AUTHENTICATION (LOGIN + RESET PASSWORD)
------------------------------------------------------ */

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
      return res
        .status(400)
        .json({ error: "Vui lòng nhập Tên đăng nhập và Mật khẩu." });

    const [rows] = await db.query(
      `SELECT u.id, u.MaPQ, u.TenDN, u.HoTen, u.TrangThai, u.MatKhau, r.TenPQ
       FROM system_users u 
       LEFT JOIN system_roles r ON u.MaPQ = r.MaPQ
       WHERE u.TenDN = ?`,
      [username]
    );

    const user = (rows as any[])[0];
    if (!user)
      return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu." });

    if (String(user.MatKhau) !== String(password))
      return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu." });

    if (user.TrangThai !== "Hoạt động")
      return res.status(403).json({ error: "Tài khoản đang bị khóa." });

    // Nếu là nhân viên → lấy thông tin nhân viên
    let employee: any = null;
    if (user.MaPQ === "NV") {
      const [empRows] = await db.query(
        "SELECT id, MANV, HONV, TENNV, MaPB, DienThoai, Email FROM employees WHERE MANV = ?",
        [user.TenDN]
      );
      employee = (empRows as any[])[0] || null;
    }

    res.json({
      user: {
        id: user.id,
        username: user.TenDN,
        fullName: user.HoTen,
        roleCode: user.MaPQ,
        roleName: user.TenPQ,
      },
      employee,
      token: "simple-demo-token",
    });
  })
);

// Quên mật khẩu: dùng Email + SĐT tra theo employees (join bằng MaNV)
app.post(
  "/api/auth/reset-password",
  asyncHandler(async (req, res) => {
    const { email, phone, newPassword } = req.body;

    if (!email || !phone || !newPassword)
      return res.status(400).json({
        error: "Vui lòng nhập đủ Email, SĐT và mật khẩu mới.",
      });

    const [rows] = await db.query(
      `SELECT u.id
       FROM system_users u
       JOIN employees e ON e.MANV = u.MaNV
       WHERE e.Email = ? AND e.DienThoai = ?
       LIMIT 1`,
      [email, phone]
    );

    const user = (rows as any[])[0];
    if (!user)
      return res.status(404).json({
        error: "Không tìm thấy tài khoản phù hợp.",
      });

    await db.query("UPDATE system_users SET MatKhau = ? WHERE id = ?", [
      newPassword,
      user.id,
    ]);

    res.json({ success: true });
  })
);

/* -----------------------------------------------------
   EMPLOYEES
------------------------------------------------------ */

app.get(
  "/api/employees",
  asyncHandler(async (_req, res) => {
    const [rows] = await db.query("SELECT * FROM employees ORDER BY MANV");
    res.json(rows);
  })
);

app.get(
  "/api/employees/:manv",
  asyncHandler(async (req, res) => {
    const [rows] = await db.query("SELECT * FROM employees WHERE MANV = ?", [
      req.params.manv,
    ]);
    if ((rows as any[]).length === 0)
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });

    res.json((rows as any[])[0]);
  })
);

app.post(
  "/api/employees",
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const avatar = (req as any).file
      ? `/uploads/avatars/${(req as any).file.filename}`
      : data.AvatarUrl || "";

    if (!data.MANV || !data.TENNV) {
      return res.status(400).json({ error: "Thiếu MANV hoặc TENNV." });
    }

    // Chuẩn hóa input: trim và chuyển rỗng => null
    const phone = (data.DienThoai || "").trim() || null;
    const email = (data.Email || "").trim() || null;
    const cmnd = (data.CMND || "").trim() || null;

    // 🔍 KIỂM TRA TRÙNG SĐT, EMAIL, CMND/CCCD
    const duplicateFields: string[] = [];

    if (phone) {
      const [rows] = await db.query(
        "SELECT MANV FROM employees WHERE DienThoai = ?",
        [phone]
      );
      if ((rows as any[]).length > 0) {
        duplicateFields.push("Số điện thoại");
      }
    }

    if (email) {
      const [rows] = await db.query(
        "SELECT MANV FROM employees WHERE Email = ?",
        [email]
      );
      if ((rows as any[]).length > 0) {
        duplicateFields.push("Email");
      }
    }

    if (cmnd) {
      const [rows] = await db.query(
        "SELECT MANV FROM employees WHERE CMND = ?",
        [cmnd]
      );
      if ((rows as any[]).length > 0) {
        duplicateFields.push("CMND/CCCD");
      }
    }

    if (duplicateFields.length > 0) {
      const msg = `Không lưu được. Các trường bị trùng: ${duplicateFields.join(
        ", "
      )}.`;
      return res.status(400).json({ error: msg, duplicateFields });
    }

    const soBHYT =
      data.SoBHYT && String(data.SoBHYT).trim() !== ""
        ? String(data.SoBHYT).trim()
        : null;

    const maSoThue =
      data.MaSoThue && String(data.MaSoThue).trim() !== ""
        ? String(data.MaSoThue).trim()
        : null;

    const [result] = await db.query(
      `INSERT INTO employees 
        (MANV, HONV, TENNV, MaPB, MaCV, DienThoai, Email, Status, AvatarUrl,
          NgaySinh, NoiSinh, GioiTinh, DanToc, TonGiao, QuocTich, CMND, HoKhau, DiaChi, NgayVaoLam,
          LoaiHopDong, TrinhDoVanHoa, TrinhDoChuyenMon, SoBHYT, MaSoThue, LuongCoBan, PhuCapChucVu)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.MANV,
        data.HONV || "",
        data.TENNV,
        data.MaPB || null,
        data.MaCV || null,
        phone || "",
        email || "",
        data.Status || "Đang làm việc",
        avatar,
        data.NgaySinh || null,
        data.NoiSinh || "",
        data.GioiTinh || "",
        data.DanToc || "",
        data.TonGiao || "",
        data.QuocTich || "",
        cmnd || "",
        data.HoKhau || "",
        data.DiaChi || "",
        data.NgayVaoLam || null,
        data.LoaiHopDong || "",
        data.TrinhDoVanHoa || "",
        data.TrinhDoChuyenMon || "",
        soBHYT,
        maSoThue,
        data.LuongCoBan || null,
        data.PhuCapChucVu || null,
      ]
    );

    const [rows] = await db.query("SELECT * FROM employees WHERE id = ?", [
      (result as any).insertId,
    ]);
    res.status(201).json((rows as any[])[0]);
  })
);

app.put(
  "/api/employees/:manv",
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    const data = req.body;
    const currentManv = req.params.manv;

    const avatar = (req as any).file
      ? `/uploads/avatars/${(req as any).file.filename}`
      : data.AvatarUrl || "";

    if (!data.MANV || !data.TENNV) {
      return res.status(400).json({ error: "Thiếu MANV hoặc TENNV." });
    }

    // 1. Lấy thông tin cũ
    const [empRows] = await db.query(
      "SELECT id, DienThoai, Email, CMND, LuongCoBan, PhuCapChucVu FROM employees WHERE MANV = ?",
      [currentManv]
    );

    if ((empRows as any[]).length === 0) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });
    }

    const oldEmp = (empRows as any[])[0];
    const employeeId = oldEmp.id as number;
    const oldBasic = oldEmp.LuongCoBan as number | null;
    const oldAllowance = oldEmp.PhuCapChucVu as number | null;

    const oldPhone = (oldEmp.DienThoai || "").trim();
    const oldEmail = (oldEmp.Email || "").trim();
    const oldCmnd = (oldEmp.CMND || "").trim();

    // Chuẩn hóa input mới
    const phone = (data.DienThoai || "").trim();
    const email = (data.Email || "").trim();
    const cmnd = (data.CMND || "").trim();

    // 2. Kiểm tra trùng SĐT / Email / CMND với NHÂN VIÊN KHÁC
    const duplicateMessages: string[] = [];

    if (phone && phone !== oldPhone) {
      const [rows] = await db.query(
        "SELECT MANV FROM employees WHERE DienThoai = ? AND MANV <> ?",
        [phone, currentManv]
      );
      if ((rows as any[]).length > 0) {
        duplicateMessages.push("Số điện thoại đã được sử dụng cho nhân viên khác.");
      }
    }

    if (email && email !== oldEmail) {
      const [rows] = await db.query(
        "SELECT MANV FROM employees WHERE Email = ? AND MANV <> ?",
        [email, currentManv]
      );
      if ((rows as any[]).length > 0) {
        duplicateMessages.push("Email đã được sử dụng cho nhân viên khác.");
      }
    }

    if (cmnd && cmnd !== oldCmnd) {
      const [rows] = await db.query(
        "SELECT MANV FROM employees WHERE CMND = ? AND MANV <> ?",
        [cmnd, currentManv]
      );
      if ((rows as any[]).length > 0) {
        duplicateMessages.push("Số CMND/CCCD đã được sử dụng cho nhân viên khác.");
      }
    }

    if (duplicateMessages.length > 0) {
      const msg = `Không lưu được. ${duplicateMessages.join(" ")}`;
      return res.status(400).json({ error: msg });
    }

    // 3. Lương mới
    const newBasic =
      data.LuongCoBan !== undefined && data.LuongCoBan !== ""
        ? Number(data.LuongCoBan)
        : null;

    const newAllowance =
      data.PhuCapChucVu !== undefined && data.PhuCapChucVu !== ""
        ? Number(data.PhuCapChucVu)
        : null;

    const soBHYT =
      data.SoBHYT && String(data.SoBHYT).trim() !== ""
        ? String(data.SoBHYT).trim()
        : null;

    const maSoThue =
      data.MaSoThue && String(data.MaSoThue).trim() !== ""
        ? String(data.MaSoThue).trim()
        : null;

    // 4. Cập nhật employees
    await db.query(
      `UPDATE employees SET 
        MANV=?, HONV=?, TENNV=?, MaPB=?, MaCV=?, DienThoai=?, Email=?, Status=?, AvatarUrl=?,
        NgaySinh=?, NoiSinh=?, GioiTinh=?, DanToc=?, TonGiao=?, QuocTich=?, CMND=?, HoKhau=?, DiaChi=?, NgayVaoLam=?,
        LoaiHopDong=?, TrinhDoVanHoa=?, TrinhDoChuyenMon=?, SoBHYT=?, MaSoThue=?, LuongCoBan=?, PhuCapChucVu=?
      WHERE MANV=?`,
      [
        data.MANV,
        data.HONV || "",
        data.TENNV,
        data.MaPB || null,
        data.MaCV || null,
        phone || "",
        email || "",
        data.Status || "Đang làm việc",
        avatar,
        data.NgaySinh || null,
        data.NoiSinh || "",
        data.GioiTinh || "",
        data.DanToc || "",
        data.TonGiao || "",
        data.QuocTich || "",
        cmnd || "",
        data.HoKhau || "",
        data.DiaChi || "",
        data.NgayVaoLam || null,
        data.LoaiHopDong || "",
        data.TrinhDoVanHoa || "",
        data.TrinhDoChuyenMon || "",
        soBHYT,
        maSoThue,
        newBasic,
        newAllowance,
        currentManv,
      ]
    );

    // 5. Ghi lịch sử lương nếu thay đổi
    const changedBasic = (oldBasic || 0) !== (newBasic || 0);
    const changedAllowance = (oldAllowance || 0) !== (newAllowance || 0);

    if (changedBasic || changedAllowance) {
      try {
        await db.query(
          `INSERT INTO salary_history 
             (employee_id, effective_date, old_basic_salary, old_allowance, new_basic_salary, new_allowance, note)
           VALUES (?, CURDATE(), ?, ?, ?, ?, ?)`,
          [
            employeeId,
            oldBasic,
            oldAllowance,
            newBasic,
            newAllowance,
            "Điều chỉnh từ màn hình hồ sơ nhân viên",
          ]
        );
      } catch (err) {
        console.error(
          "Lỗi khi ghi lịch sử lương (không chặn lưu nhân viên):",
          err
        );
      }
    }

    // 6. Trả lại bản ghi mới nhất
    const [rows] = await db.query("SELECT * FROM employees WHERE MANV = ?", [
      data.MANV,
    ]);

    if ((rows as any[]).length === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy nhân viên sau khi cập nhật." });
    }

    res.json((rows as any[])[0]);
  })
);

app.delete(
  "/api/employees/:manv",
  asyncHandler(async (req, res) => {
    await db.query("DELETE FROM employees WHERE MANV = ?", [req.params.manv]);
    res.json({ success: true });
  })
);

/* -----------------------------------------------------
   PHÒNG BAN
------------------------------------------------------ */

app.get(
  "/api/departments",
  asyncHandler(async (_req, res) => {
    const [rows] = await db.query("SELECT * FROM departments ORDER BY MaPB");
    res.json(rows);
  })
);

app.post(
  "/api/departments",
  asyncHandler(async (req, res) => {
    const { MaPB, TenPB } = req.body;
    if (!MaPB || !TenPB)
      return res.status(400).json({ error: "Thiếu Mã PB hoặc Tên PB." });

    const [result] = await db.query(
      "INSERT INTO departments (MaPB, TenPB) VALUES (?, ?)",
      [MaPB, TenPB]
    );

    const [rows] = await db.query("SELECT * FROM departments WHERE id = ?", [
      (result as any).insertId,
    ]);
    res.status(201).json((rows as any[])[0]);
  })
);

app.put(
  "/api/departments/:mapb",
  asyncHandler(async (req, res) => {
    const { MaPB, TenPB } = req.body;
    if (!MaPB || !TenPB)
      return res.status(400).json({ error: "Thiếu Mã PB hoặc Tên PB." });

    await db.query(
      "UPDATE departments SET MaPB=?, TenPB=? WHERE MaPB=?",
      [MaPB, TenPB, req.params.mapb]
    );

    const [rows] = await db.query("SELECT * FROM departments WHERE MaPB=?", [
      MaPB,
    ]);
    res.json((rows as any[])[0]);
  })
);

app.delete(
  "/api/departments/:mapb",
  asyncHandler(async (req, res) => {
    await db.query("DELETE FROM departments WHERE MaPB=?", [req.params.mapb]);
    res.json({ success: true });
  })
);

/* -----------------------------------------------------
   LƯƠNG (PAYROLL)
------------------------------------------------------ */

app.get(
  "/api/payroll",
  asyncHandler(async (req, res) => {
    const { month, year, week } = req.query;

    let sql =
      "SELECT p.*, e.MANV, e.HONV, e.TENNV FROM payroll p JOIN employees e ON p.employee_id = e.id";
    const conditions: string[] = [];
    const params: any[] = [];

    if (month && year) {
      conditions.push("MONTH(p.month)=? AND YEAR(p.month)=?");
      params.push(Number(month), Number(year));
    } else if (month) {
      conditions.push("p.month=?");
      params.push(month);
    }

    if (week) {
      conditions.push("p.week_no=?");
      params.push(Number(week));
    }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");

    const [rows] = await db.query(sql, params);
    res.json(rows);
  })
);

/* -----------------------------------------------------
   CHẤM CÔNG (ATTENDANCE)
------------------------------------------------------ */

app.get(
  "/api/attendance",
  asyncHandler(async (req, res) => {
    const { date, month, manv } = req.query;

    let sql =
      "SELECT a.*, e.MANV, e.HONV, e.TENNV FROM attendance a JOIN employees e ON a.employee_id = e.id";
    const conditions: string[] = [];
    const params: any[] = [];

    if (date) {
      conditions.push("a.date=?");
      params.push(date);
    }

    if (month) {
      conditions.push("DATE_FORMAT(a.date,'%Y-%m')=?");
      params.push(month);
    }

    if (manv) {
      conditions.push("e.MANV=?");
      params.push(manv);
    }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");

    sql += " ORDER BY a.date, e.MANV";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  })
);

app.post(
  "/api/attendance/upsert-many",
  asyncHandler(async (req, res) => {
    const { manv, month, days } = req.body;

    if (!manv || !month || !Array.isArray(days))
      return res.status(400).json({ error: "Thiếu manv / month / days." });

    const [empRows] = await db.query(
      "SELECT id FROM employees WHERE MANV=?",
      [manv]
    );
    if ((empRows as any[]).length === 0)
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });

    const employeeId = (empRows as any[])[0].id;

    for (const d of days) {
      if (!d.date) continue;

      if (!d.status) {
        await db.query(
          "DELETE FROM attendance WHERE employee_id=? AND date=?",
          [employeeId, d.date]
        );
      } else {
        await db.query(
          `INSERT INTO attendance (employee_id, date, status)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status)`,
          [employeeId, d.date, d.status]
        );
      }
    }

    res.json({ success: true });
  })
);

app.put("/api/attendance/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "Missing status" });

  await db.query("UPDATE attendance SET status = ? WHERE id = ?", [
    status,
    id,
  ]);

  res.json({ success: true });
});

app.post("/api/attendance", async (req, res) => {
  const { employee_id, date, status } = req.body;

  if (!employee_id || !date || !status) {
    return res
      .status(400)
      .json({ error: "Thiếu employee_id, date hoặc status" });
  }

  const [result]: any = await db.query(
    "INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)",
    [employee_id, date, status]
  );

  res.json({ success: true, id: result.insertId });
});

app.delete("/api/attendance/:id", async (req, res) => {
  const { id } = req.params;
  await db.query("DELETE FROM attendance WHERE id = ?", [id]);
  res.json({ success: true });
});

/* -----------------------------------------------------
   INSURANCE & TAX
------------------------------------------------------ */

app.get(
  "/api/insurance-tax",
  asyncHandler(async (req, res) => {
    const { month, year } = req.query;

    let sql =
      "SELECT it.*, e.MANV, e.HONV, e.TENNV FROM insurance_tax it JOIN employees e ON it.employee_id = e.id";
    const params: any[] = [];

    if (month && year) {
      sql += " WHERE MONTH(it.month)=? AND YEAR(it.month)=?";
      params.push(Number(month), Number(year));
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  })
);

/* -----------------------------------------------------
   TÀI KHOẢN HỆ THỐNG (SYSTEM USERS)
------------------------------------------------------ */

// Lấy danh sách tài khoản hệ thống
app.get(
  "/api/system-users",
  asyncHandler(async (_req, res) => {
    const [rows] = await db.query(
      `SELECT 
          u.id,
          u.TenDN,
          u.HoTen,
          u.MaPQ,
          u.TrangThai,
          u.MatKhau,
          u.MaNV,
          u.TenNV,
          u.DienThoai,
          u.Email,
          r.TenPQ
       FROM system_users u
       LEFT JOIN system_roles r ON u.MaPQ = r.MaPQ
       ORDER BY u.id`
    );

    res.json(rows);
  })
);

// Tạo mới tài khoản hệ thống
app.post(
  "/api/system-users",
  asyncHandler(async (req, res) => {
    const {
      MaPQ,
      TenDN,
      TrangThai,
      MatKhau,
      MaNV,
      TenNV,
      DienThoai,
      Email,
    } = req.body;

    if (!MaPQ || !TenDN || !MatKhau) {
      return res
        .status(400)
        .json({ error: "Thiếu Mã quyền, Tên đăng nhập hoặc Mật khẩu." });
    }

    const hoTenValue = TenNV || "";

    // Check trùng username
    const [existRows] = await db.query(
      "SELECT id FROM system_users WHERE TenDN = ?",
      [TenDN]
    );
    if ((existRows as any[]).length > 0) {
      return res.status(409).json({ error: "Tên đăng nhập đã tồn tại." });
    }

    const [result] = await db.query(
      `INSERT INTO system_users 
         (MaPQ, TenDN, HoTen, TrangThai, MatKhau, MaNV, TenNV, DienThoai, Email) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        MaPQ,
        TenDN,
        hoTenValue,
        TrangThai || "Hoạt động",
        MatKhau,
        MaNV || null,
        TenNV || null,
        DienThoai || null,
        Email || null,
      ]
    );

    const newId = (result as any).insertId;

    const [rows] = await db.query(
      `SELECT 
          u.id,
          u.TenDN,
          u.HoTen,
          u.MaPQ,
          u.TrangThai,
          u.MatKhau,
          u.MaNV,
          u.TenNV,
          u.DienThoai,
          u.Email,
          r.TenPQ
       FROM system_users u
       LEFT JOIN system_roles r ON u.MaPQ = r.MaPQ
       WHERE u.id = ?`,
      [newId]
    );

    res.status(201).json((rows as any[])[0]);
  })
);

// Cập nhật tài khoản hệ thống
app.put(
  "/api/system-users/:id",
  asyncHandler(async (req, res) => {
    const {
      MaPQ,
      TenDN,
      TrangThai,
      MatKhau,
      MaNV,
      TenNV,
      DienThoai,
      Email,
    } = req.body;
    const { id } = req.params;

    if (!MaPQ || !TenDN) {
      return res
        .status(400)
        .json({ error: "Thiếu Mã quyền hoặc Tên đăng nhập." });
    }

    const hoTenValue = TenNV || "";

    let sql =
      "UPDATE system_users SET MaPQ = ?, TenDN = ?, HoTen = ?, TrangThai = ?, MaNV = ?, TenNV = ?, DienThoai = ?, Email = ?";
    const params: any[] = [
      MaPQ,
      TenDN,
      hoTenValue,
      TrangThai || "Hoạt động",
      MaNV || null,
      TenNV || null,
      DienThoai || null,
      Email || null,
    ];

    if (MatKhau && String(MatKhau).trim() !== "") {
      sql += ", MatKhau = ?";
      params.push(MatKhau);
    }

    sql += " WHERE id = ?";
    params.push(id);

    await db.query(sql, params);

    const [rows] = await db.query(
      `SELECT 
          u.id,
          u.TenDN,
          u.HoTen,
          u.MaPQ,
          u.TrangThai,
          u.MatKhau,
          u.MaNV,
          u.TenNV,
          u.DienThoai,
          u.Email,
          r.TenPQ
       FROM system_users u
       LEFT JOIN system_roles r ON u.MaPQ = r.MaPQ
       WHERE u.id = ?`,
      [id]
    );

    res.json((rows as any[])[0]);
  })
);

// Xóa tài khoản
app.delete(
  "/api/system-users/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await db.query("DELETE FROM system_users WHERE id = ?", [id]);

    res.json({ success: true });
  })
);

// Reset mật khẩu tài khoản (ví dụ: về 123456)
app.put(
  "/api/system-users/:id/reset-password",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const defaultPassword = "123456";

    await db.query("UPDATE system_users SET MatKhau = ? WHERE id = ?", [
      defaultPassword,
      id,
    ]);

    res.json({
      success: true,
      message: `Mật khẩu đã được reset về mặc định: ${defaultPassword}`,
    });
  })
);

// Danh sách quyền (role) dùng cho combobox khi tạo/sửa tài khoản
app.get(
  "/api/system-roles",
  asyncHandler(async (_req, res) => {
    const [rows] = await db.query(
      "SELECT id, MaPQ, TenPQ, MoTa FROM system_roles ORDER BY id"
    );
    res.json(rows);
  })
);
// ===============================
// API: Lấy nhân viên theo Mã NV
// ===============================
// ===============================
// API: Lấy nhân viên theo Mã NV (chuẩn hoá, chống lỗi)
// ===============================
app.get("/api/employees/by-code", async (req, res) => {
  try {
    let rawCode = (req.query.MaNV ?? "").toString();
    const normCode = rawCode.trim().toUpperCase(); // chuẩn hoá mã NV

    console.log("🔍 Tra cứu nhân viên theo MANV:", {
      rawCode,
      normCode,
    });

    if (!normCode) {
      return res
        .status(400)
        .json({ message: "Thiếu mã nhân viên (MaNV)." });
    }

    const [rows]: any = await db.query(
      `SELECT 
         MANV,
         HONV,
         TENNV,
         DienThoai,
         Email
       FROM employees
       WHERE TRIM(UPPER(MANV)) = ?`,
      [normCode]
    );

    if (!rows || rows.length === 0) {
      // gửi thêm thông tin debug ra ngoài cho dễ kiểm tra
      return res.status(404).json({
        message: "Không tìm thấy mã nhân viên.",
        debug: { normCode },
      });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error("❌ Lỗi API /employees/by-code:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi lấy nhân viên." });
  }
});


/* -----------------------------------------------------
   DASHBOARD SUMMARY
------------------------------------------------------ */

app.get(
  "/api/dashboard/summary",
  asyncHandler(async (_req, res) => {
    const [empCount] = await db.query(
      "SELECT COUNT(*) AS totalEmployees FROM employees"
    );

    const [salary] = await db.query(
      `SELECT COALESCE(SUM(net_salary),0) AS totalSalary
       FROM payroll WHERE YEAR(month)=YEAR(CURDATE()) AND MONTH(month)=MONTH(CURDATE())`
    );

    const [avg] = await db.query(
      `SELECT COALESCE(AVG(net_salary),0) AS avgSalary
       FROM payroll WHERE YEAR(month)=YEAR(CURDATE()) AND MONTH(month)=MONTH(CURDATE())`
    );

    const [newEmp] = await db.query(
      `SELECT COUNT(*) AS newEmployees 
       FROM employees WHERE YEAR(NgayVaoLam)=YEAR(CURDATE())`
    );

    const [dept] = await db.query(
      `SELECT COALESCE(d.TenPB,'Chưa phân phòng') AS department,
              COUNT(e.id) AS count
       FROM employees e 
       LEFT JOIN departments d ON e.MaPB=d.MaPB
       GROUP BY department
       ORDER BY department`
    );

    const [rangeRows] = await db.query(
      `SELECT 
          SUM(CASE WHEN net_salary < 10000000 THEN 1 ELSE 0 END) AS under_10m,
          SUM(CASE WHEN net_salary BETWEEN 10000000 AND 20000000 THEN 1 ELSE 0 END) AS from_10_to_20m,
          SUM(CASE WHEN net_salary > 20000000 THEN 1 ELSE 0 END) AS over_20m
       FROM payroll 
       WHERE YEAR(month)=YEAR(CURDATE()) AND MONTH(month)=MONTH(CURDATE())`
    );

    res.json({
      totalEmployees: Number((empCount as any[])[0].totalEmployees),
      totalSalary: Number((salary as any[])[0].totalSalary),
      avgSalary: Number((avg as any[])[0].avgSalary),
      newEmployees: Number((newEmp as any[])[0].newEmployees),
      departments: dept,
      salaryRanges: {
        under10m: Number((rangeRows as any[])[0].under_10m),
        from10to20m: Number((rangeRows as any[])[0].from_10_to_20m),
        over20m: Number((rangeRows as any[])[0].over_20m),
      },
    });
  })
);

/* -----------------------------------------------------
   EMPLOYEE SELF SERVICE
------------------------------------------------------ */

app.get(
  "/api/employee-profile/:manv",
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      "SELECT * FROM employees WHERE MANV=?",
      [req.params.manv]
    );
    if ((rows as any[]).length === 0)
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });

    res.json((rows as any[])[0]);
  })
);

app.get(
  "/api/employee-payroll/:manv",
  asyncHandler(async (req, res) => {
    const [emp] = await db.query(
      "SELECT id FROM employees WHERE MANV=?",
      [req.params.manv]
    );

    if ((emp as any[]).length === 0)
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });

    const empId = (emp as any[])[0].id;

    const [rows] = await db.query(
      "SELECT * FROM payroll WHERE employee_id=? ORDER BY month DESC",
      [empId]
    );

    res.json(rows);
  })
);

app.get(
  "/api/employee-insurance-tax/:manv",
  asyncHandler(async (req, res) => {
    const [emp] = await db.query(
      "SELECT id FROM employees WHERE MANV=?",
      [req.params.manv]
    );

    if ((emp as any[]).length === 0)
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });

    const empId = (emp as any[])[0].id;

    const [rows] = await db.query(
      "SELECT * FROM insurance_tax WHERE employee_id=? ORDER BY month DESC",
      [empId]
    );

    res.json(rows);
  })
);

/* -----------------------------------------------------
   DIỄN BIẾN CÔNG TÁC (EMPLOYMENT EVENTS)
------------------------------------------------------ */

// Lấy danh sách diễn biến theo MANV
app.get(
  "/api/employees/:manv/employment-events",
  asyncHandler(async (req, res) => {
    const { manv } = req.params;

    const [empRows] = await db.query(
      "SELECT id FROM employees WHERE MANV = ?",
      [manv]
    );
    const emp = (empRows as any[])[0];

    if (!emp) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });
    }

    const employeeId = emp.id;

    const [rows] = await db.query(
      `SELECT 
         id,
         employee_id,
         DATE_FORMAT(date, '%Y-%m-%d') AS date,
         title,
         description
       FROM employment_events
       WHERE employee_id = ?
       ORDER BY date DESC, id DESC`,
      [employeeId]
    );

    res.json(rows);
  })
);

// Thêm diễn biến mới cho nhân viên theo MANV
app.post(
  "/api/employees/:manv/employment-events",
  asyncHandler(async (req, res) => {
    const { manv } = req.params;
    const { date, title, description } = req.body;

    if (!date || !title) {
      return res
        .status(400)
        .json({ error: "Thiếu ngày hoặc tiêu đề diễn biến." });
    }

    const [empRows] = await db.query(
      "SELECT id FROM employees WHERE MANV = ?",
      [manv]
    );
    const emp = (empRows as any[])[0];

    if (!emp) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });
    }

    const employeeId = emp.id;

    const [result] = await db.query(
      `INSERT INTO employment_events (employee_id, date, title, description)
       VALUES (?, ?, ?, ?)`,
      [employeeId, date, title, description || ""]
    );

    const [rows] = await db.query(
      `SELECT 
         id,
         employee_id,
         DATE_FORMAT(date, '%Y-%m-%d') AS date,
         title,
         description
       FROM employment_events
       WHERE id = ?`,
      [(result as any).insertId]
    );

    res.status(201).json((rows as any[])[0]);
  })
);

// Cập nhật diễn biến theo ID
app.put(
  "/api/employment-events/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { date, title, description } = req.body;

    if (!date || !title) {
      return res
        .status(400)
        .json({ error: "Thiếu ngày hoặc tiêu đề diễn biến." });
    }

    const [existRows] = await db.query(
      "SELECT * FROM employment_events WHERE id = ?",
      [id]
    );
    if ((existRows as any[]).length === 0) {
      return res.status(404).json({ error: "Không tìm thấy diễn biến." });
    }

    await db.query(
      `UPDATE employment_events
       SET date = ?, title = ?, description = ?
       WHERE id = ?`,
      [date, title, description || "", id]
    );

    const [rows] = await db.query(
      `SELECT 
         id,
         employee_id,
         DATE_FORMAT(date, '%Y-%m-%d') AS date,
         title,
         description
       FROM employment_events
       WHERE id = ?`,
      [id]
    );

    res.json((rows as any[])[0]);
  })
);

// Xóa diễn biến theo ID
app.delete(
  "/api/employment-events/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await db.query("DELETE FROM employment_events WHERE id = ?", [id]);

    res.json({ success: true });
  })
);

/* -----------------------------------------------------
   CHỨNG CHỈ ĐÀO TẠO (TRAINING CERTIFICATES)
------------------------------------------------------ */

// Lấy danh sách chứng chỉ theo MANV
app.get(
  "/api/employees/:manv/certificates",
  asyncHandler(async (req, res) => {
    const { manv } = req.params;

    const [empRows] = await db.query(
      "SELECT id FROM employees WHERE MANV = ?",
      [manv]
    );
    const emp = (empRows as any[])[0];

    if (!emp) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });
    }

    const employeeId = emp.id;

    const [rows] = await db.query(
      `SELECT 
         id,
         employee_id,
         name,
         provider,
         DATE_FORMAT(issue_date, '%Y-%m-%d')  AS issue_date,
         DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiry_date,
         note
       FROM training_certificates
       WHERE employee_id = ?
       ORDER BY issue_date DESC, id DESC`,
      [employeeId]
    );

    res.json(rows);
  })
);

// Thêm chứng chỉ mới cho nhân viên
app.post(
  "/api/employees/:manv/certificates",
  asyncHandler(async (req, res) => {
    const { manv } = req.params;
    const { name, provider, issue_date, expiry_date, note } = req.body;

    if (!name || !provider || !issue_date) {
      return res
        .status(400)
        .json({ error: "Thiếu tên chứng chỉ, đơn vị cấp hoặc ngày cấp." });
    }

    const [empRows] = await db.query(
      "SELECT id FROM employees WHERE MANV = ?",
      [manv]
    );
    const emp = (empRows as any[])[0];

    if (!emp) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });
    }

    const employeeId = emp.id;

    const [result] = await db.query(
      `INSERT INTO training_certificates
         (employee_id, name, provider, issue_date, expiry_date, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employeeId, name, provider, issue_date, expiry_date || null, note || ""]
    );

    const [rows] = await db.query(
      `SELECT 
         id,
         employee_id,
         name,
         provider,
         DATE_FORMAT(issue_date, '%Y-%m-%d')  AS issue_date,
         DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiry_date,
         note
       FROM training_certificates
       WHERE id = ?`,
      [(result as any).insertId]
    );

    res.status(201).json((rows as any[])[0]);
  })
);

// Cập nhật chứng chỉ
app.put(
  "/api/certificates/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, provider, issue_date, expiry_date, note } = req.body;

    if (!name || !provider || !issue_date) {
      return res
        .status(400)
        .json({ error: "Thiếu tên chứng chỉ, đơn vị cấp hoặc ngày cấp." });
    }

    const [existRows] = await db.query(
      "SELECT * FROM training_certificates WHERE id = ?",
      [id]
    );
    if ((existRows as any[]).length === 0) {
      return res.status(404).json({ error: "Không tìm thấy chứng chỉ." });
    }

    await db.query(
      `UPDATE training_certificates
       SET name = ?, provider = ?, issue_date = ?, expiry_date = ?, note = ?
       WHERE id = ?`,
      [name, provider, issue_date, expiry_date || null, note || "", id]
    );

    const [rows] = await db.query(
      `SELECT 
         id,
         employee_id,
         name,
         provider,
         DATE_FORMAT(issue_date, '%Y-%m-%d')   AS issue_date,
         DATE_FORMAT(expiry_date, '%Y-%m-%d')  AS expiry_date,
         note
       FROM training_certificates
       WHERE id = ?`,
      [id]
    );

    res.json((rows as any[])[0]);
  })
);

// Xóa chứng chỉ
app.delete(
  "/api/certificates/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await db.query("DELETE FROM training_certificates WHERE id = ?", [id]);

    res.json({ success: true });
  })
);

/* -----------------------------------------------------
   LỊCH SỬ ĐIỀU CHỈNH LƯƠNG
------------------------------------------------------ */

app.get(
  "/api/employees/:manv/salary-history",
  asyncHandler(async (req, res) => {
    const { manv } = req.params;

    const [empRows] = await db.query(
      "SELECT id FROM employees WHERE MANV = ?",
      [manv]
    );
    const emp = (empRows as any[])[0];

    if (!emp) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });
    }

    const employeeId = emp.id;

    const [rows] = await db.query(
      `SELECT 
          id,
          DATE_FORMAT(effective_date, '%Y-%m-%d') AS effective_date,
          old_basic_salary,
          old_allowance,
          new_basic_salary,
          new_allowance,
          note
       FROM salary_history
       WHERE employee_id = ?
       ORDER BY effective_date DESC, id DESC`,
      [employeeId]
    );

    res.json(rows);
  })
);

/* -----------------------------------------------------
   START SERVER
------------------------------------------------------ */

app.get("/", (_req, res) => {
  res.json({ message: "Server chạy OK!" });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});
