import React, { createContext, useState, useContext } from 'react';

// Tạo AuthContext
export const AuthContext = createContext();

// AuthProvider component để bao bọc các component con và cung cấp context
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Hàm cập nhật thông tin người dùng
  const setAuth = (user) => {
    setUser(user);
    // Lưu thông tin người dùng vào localStorage nếu cần
  };

  // Hàm để set dữ liệu người dùng (có thể bao gồm email, profile, ...)
  const setUserData = (data) => {
    setUser(data); // hoặc một state khác để lưu dữ liệu
  };

  return (
    <AuthContext.Provider value={{ user, setAuth, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để sử dụng AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};
