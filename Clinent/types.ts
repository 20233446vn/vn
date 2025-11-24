// Enum definitions based on prompt requirements

export enum Role {
  DIRECTOR = 'Giám đốc',
  MANAGER = 'Quản lý',
  STAFF = 'Nhân viên'
}

export enum ContractType {
  OFFICIAL = 'Hợp đồng chính thức',
  PROBATION = 'Hợp đồng thử việc',
  PART_TIME = 'Bán thời gian'
}

export interface Department {
  MaPB: string;
  TenPB: string;
}

export interface Position {
  MaCV: string;
  TenCV: string;
  PhuCap: number;
}

// Main Employee Interface (NhanVien)
export interface Employee {
  MANV: string;
  HONV: string;
  TENNV: string;
  GioiTinh: 'Nam' | 'Nữ';
  NgaySinh: string;
  NoiSinh: string;
  SoCMND: string;
  DienThoai: string;
  Email: string;
  DiaChi: string; // ChoOHienTai
  NgayVaoLam: string;
  MaPB: string; // Foreign Key to Department
  MaCV: string; // Foreign Key to Position
  DanToc: string;
  TonGiao: string;
  TrinhDoVanHoa: string;
  TrinhDoChuyenMon: string; // e.g., Đại học, Cao đẳng
  AvatarUrl?: string;
  Status: 'Đang làm việc' | 'Nghỉ thai sản' | 'Đã nghỉ việc';
}

// Salary Record (BangLuong)
export interface SalaryRecord {
  Id: string;
  MaNV: string;
  Thang: number;
  Nam: number;
  LuongCB: number; // Basic Salary
  HeSoLuong: number;
  PhuCap: number;
  SoNgayCong: number;
  TangCa: number; // Hours
  BHXH: number; // Social Insurance (New)
  ThueTNCN: number; // Personal Income Tax (New)
  KhauTru: number; // Total Deductions (Sum of BHXH + Tax + Others)
  ThucLanh: number; // Net Salary
}

// Attendance Record
export interface Attendance {
  MaNV: string;
  Ngay: string;
  CheckIn: string;
  CheckOut: string;
  TrangThai: 'Đúng giờ' | 'Đi muộn' | 'Vắng' | 'Phép';
}

// System User (NguoiDung / PhanQuyen)
export interface SystemUser {
  MaPQ: string; // ID
  TenDN: string; // Username
  HoTen: string;
  QuyenHan: string; // Role Name
  TrangThai: 'Hoạt động' | 'Khóa';
}

export interface SystemRole {
  MaPQ: string;
  TenPQ: string; // Role Name
  MoTa: string;
}

// Navigation Item
export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}