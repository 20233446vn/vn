import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, RoleCode } from "./AuthContext";

interface Props {
  children: React.ReactNode;
  allowRoles?: RoleCode[]; // nếu không truyền => chỉ cần đăng nhập
}

const ProtectedRoute: React.FC<Props> = ({ children, allowRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowRoles && !allowRoles.includes(user.roleCode)) {
    // Không đủ quyền → đưa về trang không có quyền (hoặc dashboard chung)
    return <Navigate to="/no-permission" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
