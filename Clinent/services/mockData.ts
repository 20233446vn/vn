import { Employee, Department, Position, SalaryRecord, Attendance, SystemUser, SystemRole } from '../types';

export const DEPARTMENTS: Department[] = [
  { MaPB: 'PB01', TenPB: 'Ban Giám Đốc' },
  { MaPB: 'PB02', TenPB: 'Phòng Nhân Sự' },
  { MaPB: 'PB03', TenPB: 'Phòng Kỹ Thuật' },
  { MaPB: 'PB04', TenPB: 'Phân Xưởng Sản Xuất' },
];

export const POSITIONS: Position[] = [
  { MaCV: 'CV01', TenCV: 'Giám đốc', PhuCap: 5000000 },
  { MaCV: 'CV02', TenCV: 'Trưởng phòng', PhuCap: 3000000 },
  { MaCV: 'CV03', TenCV: 'Chuyên viên', PhuCap: 1000000 },
  { MaCV: 'CV04', TenCV: 'Công nhân', PhuCap: 500000 },
];

export const EMPLOYEES: Employee[] = [
  {
    MANV: 'NV001',
    HONV: 'Nguyễn Văn',
    TENNV: 'An',
    GioiTinh: 'Nam',
    NgaySinh: '1980-05-15',
    NoiSinh: 'Hà Nội',
    SoCMND: '001080123456',
    DienThoai: '0901234567',
    Email: 'an.nguyen@hoangvinhphat.com',
    DiaChi: '123 Kim Mã, Hà Nội',
    NgayVaoLam: '2000-01-01',
    MaPB: 'PB01',
    MaCV: 'CV01',
    DanToc: 'Kinh',
    TonGiao: 'Không',
    TrinhDoVanHoa: '12/12',
    TrinhDoChuyenMon: 'Thạc sĩ QTKD',
    Status: 'Đang làm việc',
    AvatarUrl: 'https://picsum.photos/200/200?random=1'
  },
  {
    MANV: 'NV002',
    HONV: 'Trần Thị',
    TENNV: 'Bình',
    GioiTinh: 'Nữ',
    NgaySinh: '1985-08-20',
    NoiSinh: 'Hải Phòng',
    SoCMND: '031185123456',
    DienThoai: '0902345678',
    Email: 'binh.tran@hoangvinhphat.com',
    DiaChi: '45 Lê Lợi, Hải Phòng',
    NgayVaoLam: '2005-06-15',
    MaPB: 'PB02',
    MaCV: 'CV02',
    DanToc: 'Kinh',
    TonGiao: 'Phật giáo',
    TrinhDoVanHoa: '12/12',
    TrinhDoChuyenMon: 'Cử nhân Nhân sự',
    Status: 'Đang làm việc',
    AvatarUrl: 'https://picsum.photos/200/200?random=2'
  },
  {
    MANV: 'NV003',
    HONV: 'Lê Văn',
    TENNV: 'Cường',
    GioiTinh: 'Nam',
    NgaySinh: '1990-12-10',
    NoiSinh: 'Nam Định',
    SoCMND: '036090123456',
    DienThoai: '0903456789',
    Email: 'cuong.le@hoangvinhphat.com',
    DiaChi: 'Nam Định',
    NgayVaoLam: '2015-03-01',
    MaPB: 'PB03',
    MaCV: 'CV03',
    DanToc: 'Kinh',
    TonGiao: 'Thiên chúa',
    TrinhDoVanHoa: '12/12',
    TrinhDoChuyenMon: 'Kỹ sư Viễn thông',
    Status: 'Đang làm việc',
    AvatarUrl: 'https://picsum.photos/200/200?random=3'
  },
  {
    MANV: 'NV004',
    HONV: 'Phạm Thị',
    TENNV: 'Dung',
    GioiTinh: 'Nữ',
    NgaySinh: '1995-02-28',
    NoiSinh: 'Hưng Yên',
    SoCMND: '033195123456',
    DienThoai: '0904567890',
    Email: 'dung.pham@hoangvinhphat.com',
    DiaChi: 'Hưng Yên',
    NgayVaoLam: '2020-01-10',
    MaPB: 'PB04',
    MaCV: 'CV04',
    DanToc: 'Kinh',
    TonGiao: 'Không',
    TrinhDoVanHoa: '9/12',
    TrinhDoChuyenMon: 'Trung cấp Nghề',
    Status: 'Nghỉ thai sản',
    AvatarUrl: 'https://picsum.photos/200/200?random=4'
  },
   {
    MANV: 'NV005',
    HONV: 'Hoàng',
    TENNV: 'Hải',
    GioiTinh: 'Nam',
    NgaySinh: '1992-05-05',
    NoiSinh: 'Thái Bình',
    SoCMND: '033192123999',
    DienThoai: '0904567999',
    Email: 'hai.hoang@hoangvinhphat.com',
    DiaChi: 'Thái Bình',
    NgayVaoLam: '2018-01-10',
    MaPB: 'PB04',
    MaCV: 'CV04',
    DanToc: 'Kinh',
    TonGiao: 'Không',
    TrinhDoVanHoa: '12/12',
    TrinhDoChuyenMon: 'Cao đẳng',
    Status: 'Đang làm việc',
    AvatarUrl: 'https://picsum.photos/200/200?random=5'
  }
];

export const SALARY_DATA: SalaryRecord[] = [
  {
    Id: 'S001',
    MaNV: 'NV001',
    Thang: 5,
    Nam: 2024,
    LuongCB: 20000000,
    HeSoLuong: 1,
    PhuCap: 5000000,
    SoNgayCong: 22,
    TangCa: 0,
    BHXH: 2100000,
    ThueTNCN: 500000,
    KhauTru: 2600000,
    ThucLanh: 22400000
  },
  {
    Id: 'S002',
    MaNV: 'NV002',
    Thang: 5,
    Nam: 2024,
    LuongCB: 15000000,
    HeSoLuong: 1,
    PhuCap: 3000000,
    SoNgayCong: 22,
    TangCa: 5,
    BHXH: 1575000,
    ThueTNCN: 200000,
    KhauTru: 1775000,
    ThucLanh: 16225000 // Corrected calculation
  },
  {
    Id: 'S003',
    MaNV: 'NV003',
    Thang: 5,
    Nam: 2024,
    LuongCB: 10000000,
    HeSoLuong: 1,
    PhuCap: 1000000,
    SoNgayCong: 21,
    TangCa: 10,
    BHXH: 1050000,
    ThueTNCN: 0,
    KhauTru: 1050000,
    ThucLanh: 10450000
  },
  {
    Id: 'S004',
    MaNV: 'NV004',
    Thang: 5,
    Nam: 2024,
    LuongCB: 7000000,
    HeSoLuong: 1,
    PhuCap: 500000,
    SoNgayCong: 0,
    TangCa: 0,
    BHXH: 0, // Nghỉ thai sản
    ThueTNCN: 0,
    KhauTru: 0,
    ThucLanh: 3500000 // Chế độ thai sản
  },
   {
    Id: 'S005',
    MaNV: 'NV005',
    Thang: 5,
    Nam: 2024,
    LuongCB: 6500000,
    HeSoLuong: 1,
    PhuCap: 500000,
    SoNgayCong: 24,
    TangCa: 20,
    BHXH: 682500,
    ThueTNCN: 0,
    KhauTru: 682500,
    ThucLanh: 6817500
  }
];

export const SYSTEM_USERS: SystemUser[] = [
  { MaPQ: 'U001', TenDN: 'admin', HoTen: 'Quản trị viên', QuyenHan: 'Admin', TrangThai: 'Hoạt động' },
  { MaPQ: 'U002', TenDN: 'giamdoc', HoTen: 'Nguyễn Văn An', QuyenHan: 'Giám đốc', TrangThai: 'Hoạt động' },
  { MaPQ: 'U003', TenDN: 'hr_manager', HoTen: 'Trần Thị Bình', QuyenHan: 'Quản lý Nhân sự', TrangThai: 'Hoạt động' },
];

export const SYSTEM_ROLES: SystemRole[] = [
  { MaPQ: 'R001', TenPQ: 'Admin', MoTa: 'Toàn quyền hệ thống, quản lý tài khoản và cấu hình.' },
  { MaPQ: 'R002', TenPQ: 'Giám đốc', MoTa: 'Xem tất cả báo cáo, duyệt nhân sự, duyệt lương.' },
  { MaPQ: 'R003', TenPQ: 'Quản lý Nhân sự', MoTa: 'Quản lý hồ sơ nhân viên, chấm công, tính lương.' },
  { MaPQ: 'R004', TenPQ: 'Nhân viên', MoTa: 'Xem thông tin cá nhân, xem lương, lịch sử chấm công.' },
];