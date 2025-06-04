import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Footer from './setup/Footer';
import Header from './setup/Header'; // <-- Giữ nguyên Header
import Home from './Screen/HomeScreen';
import Login from './Screen/login';
import SignUp from './Screen/signup';
import ProblemScreen from './Screen/ProblemScreen';
import ProblemDetailScreen from './Screen/ProblemDetailScreen';
import ContestScreen from './Screen/ContestScreen';
import AccountManagement from './Screen/AccountManagementScreen';
import ProblemCreateScreen from './Screen/ProblemCreateScreen';
import CreatorScreen from './Screen/CreatorScreen';
import AdminScreen from './Screen/AdminScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext'; 

const AppContent = () => {
    const { loading } = useAuth(); // Lấy trạng thái loading từ AuthContext

    if (loading) {
        return (
            <div className="loading-container" style={{ textAlign: 'center', padding: '50px', fontSize: '24px' }}>
                Loading Application...
            </div>
        );
    }


    return (
        <Router>
            <Header /> 
            <Routes>
                <Route path='/home' element={<Home />} />
                <Route path='/' element={<Home />} />

                <Route path='/problem/create' element={<ProblemCreateScreen />} /> {/* Đặt route cụ thể trước */}
                <Route path='/problem' element={<ProblemScreen />} />
                <Route path='/problem/:problemId' element={<ProblemDetailScreen />} />

                <Route path='/contest' element={<ContestScreen />} />
                <Route path='/byCreator' element={<CreatorScreen />} />
                <Route path='/management' element={<AccountManagement />} />
                <Route path='/admin' element={<AdminScreen />} />
                <Route path='/login' element={<Login />} />
                <Route path='/signup' element={<SignUp />} />
            </Routes>
            <Footer />
        </Router>
    );
};

function App() {
    return (
     
        <AuthProvider>
            <AppContent /> 
        </AuthProvider>
    );
}

export default App;