import React, { useEffect, useState } from "react";
import "./AdminScreen.css"; // 👉 dùng CSS riêng nếu cần

/**
 * Trang: Quản lý người dùng
 * - Hiển thị danh sách tất cả users
 * - Mỗi user 1 dòng
 * - Không hiển thị password, timestamps
 */
function AdminScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🧩 Dữ liệu mẫu (xoá khi gọi API thực)
  const sampleUsers = [
    {
      _id: "u1",
      name: "Nguyễn Văn A",
      email: "a@example.com",
      role: "user",
    },
    {
      _id: "u2",
      name: "Trần Thị B",
      email: "b@example.com",
      role: "creator",
    },
  ];

  useEffect(() => {
    // 👉 Thay bằng fetch thực tế: GET /api/users
    setUsers(sampleUsers);
    setLoading(false);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá tài khoản này không?")) return;
    try {
      // await fetch(`/api/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleGrantCreator = async (id) => {
    try {
      // await fetch(`/api/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role: "creator" }) });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: "creator" } : u))
      );
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p>Lỗi: {error}</p>;

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
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <div className="btn-actions">
                  <button
                    onClick={() => handleGrantCreator(user._id)}
                    disabled={user.role === "creator"}
                  >
                    {user.role === "creator" ? "Đã là Creator" : "Cấp quyền Creator"}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(user._id)}
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminScreen;