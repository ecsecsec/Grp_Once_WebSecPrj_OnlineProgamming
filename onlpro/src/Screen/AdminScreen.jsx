import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./AdminScreen.css";
import { useAuth } from "../contexts/AuthContext";

/**
 * AdminScreen
 * -------------
 * - Chỉ admin mới được truy cập.
 * - Lấy JWT token từ localStorage và gửi kèm trong mọi request.
 * - Hiển thị danh sách user (mỗi user 1 dòng).
 * - Cho phép:  (1) Cấp / Hủy quyền "creator"   (2) Xoá user (trừ admin).
 */
function AdminScreen() {
  /* ---------------------- Auth ---------------------- */
  const { user, loading: authLoading } = useAuth();
  const token = localStorage.getItem("token");

  /* --------------------- State ---------------------- */
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* -------------------- Helpers --------------------- */
  const authHeader = token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};

  /* -------------------- API CALLS ------------------- */
  const fetchUsers = useCallback(async () => {
    if (!user || user.role !== "admin" || !token) return;

    try {
      setLoading(true);
      setError("");

      const { data } = await axios.get(
        "http://localhost:5000/api/admin/users",
        authHeader
      );

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (!authLoading) fetchUsers();
  }, [authLoading, fetchUsers]);

  /* ------------ Handlers: role & delete ------------- */
  const handleRoleToggle = async (id, currentRole) => {
    if (!token) return;
    const newRole = currentRole === "creator" ? "user" : "creator";

    try {
      const { data } = await axios.put(
        `http://localhost:5000/api/admin/set-role/${id}`,
        { role: newRole },
        authHeader
      );

      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: data.user.role } : u))
      );
      alert(data.message || "Cập nhật vai trò thành công");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    if (!window.confirm("Bạn có chắc muốn xoá tài khoản này không?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/admin/users/${id}`,
        authHeader
      );
      setUsers((prev) => prev.filter((u) => u._id !== id));
      alert("Đã xoá người dùng thành công");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  /* -------------------- Guards UI ------------------- */
  if (authLoading || loading) return <p>Đang tải dữ liệu...</p>;
  if (!user) return <p>Bạn cần đăng nhập để truy cập trang này.</p>;
  if (user.role !== "admin")
    return <p>Bạn không có quyền truy cập trang này.</p>;
  if (error) return <p>Lỗi: {error}</p>;

  /* --------------------- RENDER --------------------- */
  return (
    <div>
      <h2>Quản lý người dùng</h2>
      <table className="user-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="4">Không có người dùng nào.</td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <div className="btn-actions">
                    {u.role !== "admin" && (
                      <>
                        <button
                          onClick={() => handleRoleToggle(u._id, u.role)}
                        >
                          {u.role === "creator" ? "Hạn chế User" : "Cấp Creator"}
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(u._id)}
                        >
                          Xoá
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminScreen;
