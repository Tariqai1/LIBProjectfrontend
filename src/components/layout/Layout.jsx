// src/components/layout/Layout.jsx
import React from 'react';
// --- FIX: Import Outlet and NavLink ---
// NavLink is better than Link for sidebars as it knows when it's "active"
import { Outlet, NavLink } from 'react-router-dom'; 

// --- Import Icons for the sidebar ---
import {
    HomeIcon,
    BookOpenIcon,
    QueueListIcon,
    UsersIcon,
    CheckBadgeIcon,
    Cog6ToothIcon,
    TagIcon,
    RectangleStackIcon,
    LanguageIcon,
    MapPinIcon,
    ShieldCheckIcon,
    LockClosedIcon,
    ClipboardDocumentListIcon,
    KeyIcon
} from '@heroicons/react/24/outline';

// --- Helper component for Sidebar Links ---
// This uses NavLink to automatically style the active link
const SidebarLink = ({ to, icon: Icon, children }) => {
    const baseClasses = "flex items-center px-3 py-2 text-gray-300 rounded-md text-sm font-medium transition-colors duration-150";
    const hoverClasses = "hover:bg-gray-700 hover:text-white";
    
    // This function is passed to NavLink's `className` prop
    // `isActive` is provided by NavLink
    const activeClassNameFunc = ({ isActive }) =>
        isActive
            ? `${baseClasses} bg-gray-900 text-white` // Active link style
            : `${baseClasses} ${hoverClasses}`; // Inactive link style
            
    return (
        <NavLink to={to} className={activeClassNameFunc}>
            {Icon && <Icon className="h-5 w-5 mr-3 flex-shrink-0" aria-hidden="true" />}
            <span>{children}</span>
        </NavLink>
    );
};

// --- Main Layout Component ---
const Layout = () => {
    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            
            {/* --- Sidebar --- */}
            <div className="hidden md:flex md:w-64 flex-col bg-gray-800">
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* Logo/Title Area */}
                    <div className="flex items-center justify-center h-16 bg-gray-900 shadow-md">
                         {/* You can put your logo here */}
                        <span className="text-white text-xl font-bold">📚 BookNest</span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-2 py-4 space-y-1">
                        
                        {/* --- Main Section --- */}
                        <SidebarLink to="/admin/dashboard" icon={HomeIcon}>Dashboard</SidebarLink>
                        <SidebarLink to="/admin/books" icon={BookOpenIcon}>Book Management</SidebarLink>
                        <SidebarLink to="/admin/copies" icon={QueueListIcon}>Copies & Issuing</SidebarLink>
                        <SidebarLink to="/admin/users" icon={UsersIcon}>User Management</SidebarLink>
                        <SidebarLink to="/admin/approvals" icon={CheckBadgeIcon}>Approvals</SidebarLink>

                        {/* --- Configuration Section --- */}
                        <div className="pt-4 pb-2 px-3">
                            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Configuration</span>
                        </div>
                        <SidebarLink to="/admin/categories" icon={TagIcon}>Categories</SidebarLink>
                        <SidebarLink to="/admin/subcategories" icon={RectangleStackIcon}>Subcategories</SidebarLink>
                        <SidebarLink to="/admin/languages" icon={LanguageIcon}>Languages</SidebarLink>
                        <SidebarLink to="/admin/locations" icon={MapPinIcon}>Locations</SidebarLink>

                        {/* --- Security & Logs Section --- */}
                        <div className="pt-4 pb-2 px-3">
                            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Security & Logs</span>
                        </div>
                        <SidebarLink to="/admin/roles" icon={ShieldCheckIcon}>Roles & Permissions</SidebarLink>
                        <SidebarLink to="/admin/book-permissions" icon={LockClosedIcon}>Restricted Books</SidebarLink>
                        <SidebarLink to="/admin/logs" icon={ClipboardDocumentListIcon}>Audit Logs</SidebarLink>
                        <SidebarLink to="/admin/digital-access" icon={KeyIcon}>Digital Access</SidebarLink>
                        
                    </nav>

                     {/* --- Profile / Logout Area (Bottom) --- */}
                     <div className="p-4 border-t border-gray-700">
                         {/* Add your profile link and logout button here */}
                         <SidebarLink to="/profile" icon={UserCircleIcon}>My Profile</SidebarLink>
                         <SidebarLink to="/logout" icon={ArrowLeftOnRectangleIcon}>Logout</SidebarLink>
                     </div>
                </div>
            </div>

            {/* --- Main Content Area --- */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Optional Header can go here */}
                {/* <header className="bg-white shadow-sm h-16 w-full"></header> */}
                
                {/* --- FIX: <Outlet /> renders the active page --- */}
                {/* This is where Dashboard, BookManagement, etc. will be displayed */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6">
                    <Outlet />
                </main>
                {/* --- END FIX --- */}
            </div>
        </div>
    );
};

// --- Need to add these imports for the Profile/Logout links ---
import { UserCircleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

export default Layout;