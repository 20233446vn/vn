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

// Upload avatar nhân viên
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
    if (!user) return res.status(401).json({ error: "Sai tài khoản hoặc mật khẩu." });

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
       JOIN employees e ON e.MANV = u.TenDN
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

    if (!data.MANV || !data.TENNV)
      return res.status(400).json({ error: "Thiếu MANV hoặc TENNV." });

    const [result] = await db.query(
      `INSERT INTO employees 
       (MANV, HONV, TENNV, MaPB, MaCV, DienThoai, Email, Status, AvatarUrl,
        NgaySinh, NoiSinh, GioiTinh, DanToc, TonGiao, CMND, HoKhau, DiaChi, NgayVaoLam)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.MANV,
        data.HONV || "",
        data.TENNV,
        data.MaPB || null,
        data.MaCV || null,
        data.DienThoai || "",
        data.Email || "",
        data.Status || "Đang làm việc",
        avatar,
        data.NgaySinh || null,
        data.NoiSinh || "",
        data.GioiTinh || "",
        data.DanToc || "",
        data.TonGiao || "",
        data.CMND || "",
        data.HoKhau || "",
        data.DiaChi || "",
        data.NgayVaoLam || null,
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
    const avatar = (req as any).file
      ? `/uploads/avatars/${(req as any).file.filename}`
      : data.AvatarUrl || "";

    if (!data.MANV || !data.TENNV)
      return res.status(400).json({ error: "Thiếu MANV hoặc TENNV." });

    await db.query(
      `UPDATE employees SET 
       MANV=?, HONV=?, TENNV=?, MaPB=?, MaCV=?, DienThoai=?, Email=?, Status=?, AvatarUrl=?,
       NgaySinh=?, NoiSinh=?, GioiTinh=?, DanToc=?, TonGiao=?, CMND=?, HoKhau=?, DiaChi=?, NgayVaoLam=?
       WHERE MANV=?`,
      [
        data.MANV,
        data.HONV || "",
        data.TENNV,
        data.MaPB || null,
        data.MaCV || null,
        data.DienThoai || "",
        data.Email || "",
        data.Status || "Đang làm việc",
        avatar,
        data.NgaySinh || null,
        data.NoiSinh || "",
        data.GioiTinh || "",
        data.DanToc || "",
        data.TonGiao || "",
        data.CMND || "",
        data.HoKhau || "",
        data.DiaChi || "",
        data.NgayVaoLam || null,
        req.params.manv,
      ]
    );

    const [rows] = await db.query("SELECT * FROM employees WHERE MANV = ?", [
      data.MANV,
    ]);
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

/* -----------------------------------------------------
   SYSTEM USERS (TÀI KHOẢN HỆ THỐNG)
   - Quản lý tài khoản đăng nhập hệ thống
   - Tích hợp luôn: quyền (MaPQ), trạng thái, mật khẩu
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
          r.TenPQ
       FROM system_users u
       LEFT JOIN system_roles r ON u.MaPQ = r.MaPQ
       ORDER BY u.id`
    );

    // Không trả mật khẩu ra ngoài
    res.json(rows);
  })
);

// Tạo mới tài khoản hệ thống
// Tạo mới tài khoản hệ thống
app.post(
  "/api/system-users",
  asyncHandler(async (req, res) => {
    const { MaPQ, TenDN, HoTen, TrangThai, MatKhau } = req.body;

    if (!MaPQ || !TenDN || !HoTen || !MatKhau) {
      return res
        .status(400)
        .json({ error: "Thiếu Mã quyền, Tên đăng nhập, Họ tên hoặc Mật khẩu." });
    }

    const [existRows] = await db.query(
      "SELECT id FROM system_users WHERE TenDN = ?",
      [TenDN]
    );
    if ((existRows as any[]).length > 0) {
      return res.status(409).json({ error: "Tên đăng nhập đã tồn tại." });
    }

    const [result] = await db.query(
      `INSERT INTO system_users (MaPQ, TenDN, HoTen, TrangThai, MatKhau) 
       VALUES (?, ?, ?, ?, ?)`,
      [MaPQ, TenDN, HoTen, TrangThai || "Hoạt động", MatKhau]
    );

    const [rows] = await db.query(
      `SELECT 
          u.id,
          u.TenDN,
          u.HoTen,
          u.MaPQ,
          u.TrangThai,
          u.MatKhau,       -- Thêm dòng này
          r.TenPQ
       FROM system_users u
       LEFT JOIN system_roles r ON u.MaPQ = r.MaPQ
       WHERE u.id = ?`,
      [(result as any).insertId]
    );

    res.status(201).json((rows as any[])[0]);
  })
);


// Cập nhật tài khoản hệ thống
app.put(
  "/api/system-users/:id",
  asyncHandler(async (req, res) => {
    const { MaPQ, TenDN, HoTen, TrangThai, MatKhau } = req.body;
    const { id } = req.params;

    if (!MaPQ || !TenDN || !HoTen) {
      return res
        .status(400)
        .json({ error: "Thiếu Mã quyền, Tên đăng nhập hoặc Họ tên." });
    }

    let sql =
      "UPDATE system_users SET MaPQ = ?, TenDN = ?, HoTen = ?, TrangThai = ?";
    const params: any[] = [MaPQ, TenDN, HoTen, TrangThai || "Hoạt động"];

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
          u.MatKhau,       -- Thêm dòng này
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
   START SERVER
------------------------------------------------------ */

app.get("/", (_req, res) => {
  res.json({ message: "Server chạy OK!" });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});
