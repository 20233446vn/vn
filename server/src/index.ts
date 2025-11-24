import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db, testConnection } from "./config/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper: bắt lỗi async
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

// ----------------- TEST -----------------

app.get("/", (_req, res) => {
  res.json({ message: "Server chạy OK!" });
});

app.get(
  "/api/test-db",
  asyncHandler(async (_req, res) => {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    res.json({ ok: true, result: (rows as any)[0].result });
  })
);

// ----------------- NHÂN VIÊN -----------------

// Danh sách nhân viên
app.get(
  "/api/employees",
  asyncHandler(async (_req, res) => {
    const [rows] = await db.query("SELECT * FROM employees");
    res.json(rows);
  })
);

// Chi tiết 1 nhân viên theo MANV
app.get(
  "/api/employees/:manv",
  asyncHandler(async (req, res) => {
    const { manv } = req.params;
    const [rows] = await db.query("SELECT * FROM employees WHERE MANV = ?", [
      manv,
    ]);

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên." });
    }

    res.json((rows as any)[0]);
  })
);

// Thêm nhân viên
app.post(
  "/api/employees",
  asyncHandler(async (req, res) => {
    const {
      MANV,
      HONV,
      TENNV,
      MaPB,
      MaCV,
      DienThoai,
      Email,
      Status,
      AvatarUrl,
      NgaySinh,
      NoiSinh,
      GioiTinh,
      DanToc,
      TonGiao,
      CMND,
      HoKhau,
      DiaChi,
    } = req.body;

    if (!MANV || !TENNV) {
      return res
        .status(400)
        .json({ error: "Vui lòng nhập Mã nhân viên và Tên nhân viên." });
    }

    const [result] = await db.query(
      `INSERT INTO employees
       (MANV, HONV, TENNV, MaPB, MaCV, DienThoai, Email, Status, AvatarUrl,
        NgaySinh, NoiSinh, GioiTinh, DanToc, TonGiao, CMND, HoKhau, DiaChi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        MANV,
        HONV || "",
        TENNV,
        MaPB || "",
        MaCV || "",
        DienThoai || "",
        Email || "",
        Status || "",
        AvatarUrl || "",
        NgaySinh || null,
        NoiSinh || "",
        GioiTinh || "",
        DanToc || "",
        TonGiao || "",
        CMND || "",
        HoKhau || "",
        DiaChi || "",
      ]
    );

    const insertId = (result as any).insertId;
    const [rows] = await db.query("SELECT * FROM employees WHERE id = ?", [
      insertId,
    ]);
    res.status(201).json((rows as any)[0]);
  })
);

// Cập nhật nhân viên theo MANV
app.put(
  "/api/employees/:manv",
  asyncHandler(async (req, res) => {
    const { manv } = req.params;
    const {
      MANV,
      HONV,
      TENNV,
      MaPB,
      MaCV,
      DienThoai,
      Email,
      Status,
      AvatarUrl,
      NgaySinh,
      NoiSinh,
      GioiTinh,
      DanToc,
      TonGiao,
      CMND,
      HoKhau,
      DiaChi,
    } = req.body;

    if (!MANV || !TENNV) {
      return res
        .status(400)
        .json({ error: "Vui lòng nhập Mã nhân viên và Tên nhân viên." });
    }

    await db.query(
      `UPDATE employees
       SET MANV = ?, HONV = ?, TENNV = ?, MaPB = ?, MaCV = ?, DienThoai = ?,
           Email = ?, Status = ?, AvatarUrl = ?, NgaySinh = ?, NoiSinh = ?,
           GioiTinh = ?, DanToc = ?, TonGiao = ?, CMND = ?, HoKhau = ?, DiaChi = ?
       WHERE MANV = ?`,
      [
        MANV,
        HONV || "",
        TENNV,
        MaPB || "",
        MaCV || "",
        DienThoai || "",
        Email || "",
        Status || "",
        AvatarUrl || "",
        NgaySinh || null,
        NoiSinh || "",
        GioiTinh || "",
        DanToc || "",
        TonGiao || "",
        CMND || "",
        HoKhau || "",
        DiaChi || "",
        manv,
      ]
    );

    const [rows] = await db.query("SELECT * FROM employees WHERE MANV = ?", [
      MANV,
    ]);
    res.json((rows as any)[0]);
  })
);

// Xóa nhân viên theo MANV
app.delete(
  "/api/employees/:manv",
  asyncHandler(async (req, res) => {
    const { manv } = req.params;
    await db.query("DELETE FROM employees WHERE MANV = ?", [manv]);
    res.json({ success: true });
  })
);

// ----------------- PHÒNG BAN -----------------

app.get(
  "/api/departments",
  asyncHandler(async (_req, res) => {
    const [rows] = await db.query("SELECT * FROM departments");
    res.json(rows);
  })
);

// ----------------- LƯƠNG (PAYROLL) -----------------

app.get(
  "/api/payroll",
  asyncHandler(async (req, res) => {
    const month = req.query.month as string | undefined; // ví dụ: 2025-05-01
    let sql =
      "SELECT p.*, e.MANV, e.TENNV, e.PHONGBAN FROM payroll p JOIN employees e ON p.employee_id = e.id";
    const params: any[] = [];

    if (month) {
      sql += " WHERE p.month = ?";
      params.push(month);
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  })
);

// ----------------- CHẤM CÔNG (ATTENDANCE) -----------------

app.get(
  "/api/attendance",
  asyncHandler(async (req, res) => {
    const date = req.query.date as string | undefined; // 2025-05-21
    let sql =
      "SELECT a.*, e.MANV, e.TENNV FROM attendance a JOIN employees e ON a.employee_id = e.id";
    const params: any[] = [];

    if (date) {
      sql += " WHERE a.date = ?";
      params.push(date);
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  })
);

// ----------------- BẢO HIỂM & THUẾ -----------------

app.get(
  "/api/insurance-tax",
  asyncHandler(async (req, res) => {
    const month = req.query.month as string | undefined;
    let sql =
      "SELECT it.*, e.MANV, e.TENNV FROM insurance_tax it JOIN employees e ON it.employee_id = e.id";
    const params: any[] = [];

    if (month) {
      sql += " WHERE it.month = ?";
      params.push(month);
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  })
);

// ----------------- DASHBOARD SUMMARY -----------------

app.get(
  "/api/dashboard/summary",
  asyncHandler(async (_req, res) => {
    // Tổng nhân viên
    const [empCountRows] = await db.query(
      "SELECT COUNT(*) AS totalEmployees FROM employees"
    );
    const totalEmployees = (empCountRows as any)[0].totalEmployees ?? 0;

    // Tổng quỹ lương tháng hiện tại
    const [salaryRows] = await db.query(
      "SELECT COALESCE(SUM(net_salary),0) AS totalSalary " +
        "FROM payroll WHERE YEAR(month) = YEAR(CURDATE()) AND MONTH(month) = MONTH(CURDATE())"
    );
    const totalSalary = (salaryRows as any)[0].totalSalary ?? 0;

    // Lương trung bình
    const [avgRows] = await db.query(
      "SELECT COALESCE(AVG(net_salary),0) AS avgSalary " +
        "FROM payroll WHERE YEAR(month) = YEAR(CURDATE()) AND MONTH(month) = MONTH(CURDATE())"
    );
    const avgSalary = (avgRows as any)[0].avgSalary ?? 0;

    // Nhân sự mới trong năm nay (cần cột HIRE_DATE trong employees)
    const [newEmpRows] = await db.query(
      "SELECT COUNT(*) AS newEmployees " +
        "FROM employees WHERE YEAR(HIRE_DATE) = YEAR(CURDATE())"
    );
    const newEmployees = (newEmpRows as any)[0].newEmployees ?? 0;

    // Nhân sự theo phòng ban (dùng MaPB)
    const [deptRows] = await db.query(
      "SELECT PHONGBAN AS department, COUNT(*) AS count FROM employees GROUP BY PHONGBAN"
    );

    // Phân bố mức lương
    const [rangeRows] = await db.query(
      "SELECT " +
        "SUM(CASE WHEN net_salary < 10000000 THEN 1 ELSE 0 END) AS under_10m, " +
        "SUM(CASE WHEN net_salary BETWEEN 10000000 AND 20000000 THEN 1 ELSE 0 END) AS from_10_to_20m, " +
        "SUM(CASE WHEN net_salary > 20000000 THEN 1 ELSE 0 END) AS over_20m " +
        "FROM payroll WHERE YEAR(month) = YEAR(CURDATE()) AND MONTH(month) = MONTH(CURDATE())"
    );
    const ranges = (rangeRows as any)[0];

    res.json({
      totalEmployees,
      totalSalary,
      avgSalary,
      newEmployees,
      departments: deptRows,
      salaryRanges: {
        under10m: Number(ranges.under_10m || 0),
        from10to20m: Number(ranges.from_10_to_20m || 0),
        over20m: Number(ranges.over_20m || 0),
      },
    });
  })
);

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});
