// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth'; // Your hook to check auth state and role

// --- Layouts ---
import AdminLayout from "./components/layout/Layout"; 
import MainLayout from "./components/layout/Layout"; // Assuming both use the same Layout file

// --- Core Pages ---
import Login from './pages/Login';
import Logout from './pages/Logout';
import NotFound from './pages/NotFound';

// --- User-Facing Pages ---
import PublicBookList from './pages/PublicBookList';
import BookDetail from './pages/BookDetail';
import Profile from './pages/Profile';

// --- Admin Pages ---
import Dashboard from './pages/Dashboard';
import BookManagement from './pages/BookManagement';
import UserManagement from './pages/UserManagement';
import RolePermissionManagement from './pages/RolePermissionManagement';
import ApprovalManagement from './pages/ApprovalManagement';
import CopiesIssuing from './pages/CopiesIssuing';
import LanguageManagement from './pages/LanguageManagement';
import LocationManagement from './pages/LocationManagement';

// --- FIX: Import the missing/corrected pages ---
import CategoryManagement from './pages/CategoryManagement';
import SubcategoryManagement from './pages/SubcategoryManagement';
import RestrictedBookPermissions from './pages/RestrictedBookPermissions'; // Path typo fixed
// (Aapko yeh files banani hongi, agar pehle se nahi hain)
// --- END FIX ---


// --- Protected Route Component ---
// (This component checks if user is logged in or is admin)
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuth, role, isLoading } = useAuth(); // Get isLoading state

  if (isLoading) {
    // Show a full-page loader while checking for a token
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-600">Loading session...</p>
      </div>
    );
  }

  if (!isAuth) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== 'Admin') {
    // Logged in but not an admin
    return <Navigate to="/404" replace />;
  }

  // If all checks pass, render the children
  return children;
};


// --- Main Application Component ---
function App() {
  
  return (
    <Routes>
      {/* --- Public Routes (No Layout / No Protection) --- */}
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />
      
      {/* --- User Routes (Protected, use MainLayout) --- */}
      <Route
        path="/"
        element={
          <ProtectedRoute adminOnly={false}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PublicBookList />} /> 
        <Route path="books" element={<PublicBookList />} />
        <Route path="books/:id" element={<BookDetail />} />
        <Route path="profile" element={<Profile />} />
        {/* <Route path="my-books" element={<MyBooksPage />} /> */}
      </Route>

      {/* --- Admin Routes (Protected, use AdminLayout) --- */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} /> 
        
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="books" element={<BookManagement />} />
        <Route path="approvals" element={<ApprovalManagement />} />
        <Route path="copies" element={<CopiesIssuing />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="roles" element={<RolePermissionManagement />} />
        <Route path="languages" element={<LanguageManagement />} />
        <Route path="locations" element={<LocationManagement />} />
        
        {/* --- FIX: Add the routes for categories, subcategories, etc. --- */}
        <Route path="categories" element={<CategoryManagement />} />
        <Route path="subcategories" element={<SubcategoryManagement />} />
        {/* Path fixed to match sidebar link (lowercase) */}
        <Route path="book-permissions" element={<RestrictedBookPermissions />}/> 
        
        {/* (Aapke sidebar ke baaki links ke liye routes) */}
        {/* <Route path="logs" element={<AuditLogs />} /> */}
        {/* <Route path="digital-access" element={<DigitalAccess />} /> */}
        {/* --- END FIX --- */}
      </Route>
      
      {/* --- Not Found Route --- */}
      <Route path="*" element={<NotFound />} />
      <Route path="/404" element={<NotFound />} />

    </Routes>
  );
}

export default App;