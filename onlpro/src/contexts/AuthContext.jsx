// frontend/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';

const AuthContext = createContext(null);

function defineAbilityForUser(user) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);
    
    // Mọi người dùng đều có thể đọc Problem
    can('read', 'Problem'); 

    if (user) {
        // Người dùng đã đăng nhập có thể tạo Submission
        can('create', 'Submission'); 
        // Người dùng có thể đọc và cập nhật thông tin của chính họ
        can('read', 'User', { id: user.id }); 
        can('update', 'User', { id: user.id }); 
        
        if (user.role === 'admin') {
            can('manage', 'all'); 
        } else if (user.role === 'creator') { 
            can('create', 'Problem'); 
            can('update', 'Problem', { creatorId: user.id }); 
            can('delete', 'Problem', { creatorId: user.id }); 
        }
    }
    return build();
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true); // Mặc định là true khi bắt đầu
    const [isAuthenticated, setIsAuthenticated] = useState(false); 
    const [ability, setAbility] = useState(createMongoAbility()); 

    const API_BASE_URL = 'http://localhost:5000'; // Định nghĩa URL gốc API

    useEffect(() => {
        const fetchUserAndAbility = async () => {
            console.log('AuthContext: useEffect triggered. Initial loading state:', loading); 
            const token = localStorage.getItem('token');
            console.log('AuthContext: Token from localStorage:', token); 

            if (token) {
                console.log('AuthContext: Token found, attempting to fetch user data from /api/auth/me...'); 
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    const fetchedUser = response.data; 
                    console.log('AuthContext: User fetched successfully:', fetchedUser); 

                    setUser(fetchedUser);
                    setIsAuthenticated(true);
                    setAbility(defineAbilityForUser(fetchedUser));
                    
                } catch (error) {
                    console.error('AuthContext: Failed to fetch user or token invalid:', error); 
                    localStorage.removeItem('token'); // Xóa token nếu nó không hợp lệ
                    setUser(null);
                    setIsAuthenticated(false);
                    setAbility(defineAbilityForUser(null));
                }
            } else {
                console.log('AuthContext: No token found in localStorage. Setting user to null.'); 
                setUser(null);
                setIsAuthenticated(false);
                setAbility(defineAbilityForUser(null));
            }
            
            // Dòng này đảm bảo loading luôn được đặt về false sau khi hoàn thành kiểm tra ban đầu
            setLoading(false); 
            console.log('AuthContext: setLoading(false) called. Final loading state:', false); 
        };

        fetchUserAndAbility();
    }, []); // Dependency array trống để chỉ chạy một lần khi component mount

    // Sử dụng useCallback để ổn định các hàm login/logout, tốt cho hiệu suất
    const login = useCallback(async (token, userData) => {
        console.log('AuthContext: login function called.');
        localStorage.setItem('token', token);
        setUser(userData); 
        setIsAuthenticated(true);
        setAbility(defineAbilityForUser(userData));
        setLoading(false); // Đảm bảo setLoading(false) khi đăng nhập thành công
        console.log('AuthContext: User logged in, isAuthenticated:', true);
    }, []);

    const logout = useCallback(() => {
        console.log('AuthContext: logout function called.');
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        setAbility(defineAbilityForUser(null));
        setLoading(false); // Đảm bảo setLoading(false) khi đăng xuất
        console.log('AuthContext: User logged out, isAuthenticated:', false);
    }, []);

    const value = {
        user,
        isAuthenticated,
        loading, // Prop loading
        login,
        logout,
        ability,
    };

    return (
        <AuthContext.Provider value={value}>
            {
                // Chỉ render children khi loading là false
                // Điều này có nghĩa là màn hình loading của bạn sẽ biến mất
                // và nội dung ứng dụng sẽ hiển thị sau khi xác thực hoàn tất.
                !loading && children
            } 
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        // Đảm bảo useAuth chỉ được dùng trong AuthProvider
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};