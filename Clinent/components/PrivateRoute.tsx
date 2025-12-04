// Client/components/PrivateRoute.tsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface Props {
  children: React.ReactNode;   // ✔ sửa từ JSX.Element → React.ReactNode
  roles?: string[];            // danh sách roleCode được phép
}

export function PrivateRoute({ children, roles }: Props) {
  const { user } = useAuth();

  // Chưa đăng nhập → đá về login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Có check role nhưng user không thuộc role được phép
  if (roles && !roles.includes(user.roleCode)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>; // ✔ luôn wrap children đúng ReactNode
}
