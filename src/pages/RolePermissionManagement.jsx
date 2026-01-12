// src/pages/RolePermissionManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
// *** VVIP: This 'rolePermissionService' needs to be created in the 'api' folder ***
import { rolePermissionService } from '../api/rolePermissionService';
import { motion, AnimatePresence } from 'framer-motion';
import { PencilIcon, TrashIcon, PlusIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/20/solid';
import '../assets/css/ManagementPages.css'; // Your existing CSS

// Spinner Icon
const SpinnerIcon = ({ className = "text-white" }) => (
    <svg className={`animate-spin -ml-0.5 mr-2 h-4 w-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
};

const RolePermissionManagement = () => {
    // --- State ---
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [isLoadingPerms, setIsLoadingPerms] = useState(true);
    const [error, setError] = useState(null);
    
    // Role CRUD State
    const [roleName, setRoleName] = useState('');
    const [isSubmittingRole, setIsSubmittingRole] = useState(false);
    const [editingRole, setEditingRole] = useState(null);

    // Permission Editing State
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [currentRolePermissions, setCurrentRolePermissions] = useState(new Set());
    const [isLoadingRolePerms, setIsLoadingRolePerms] = useState(false);
    const [isSavingPerms, setIsSavingPerms] = useState(false);

    // --- Data Fetching ---
    const fetchRoles = useCallback(async () => {
        setIsLoadingRoles(true);
        setError(null);
        try {
            const data = await rolePermissionService.getAllRoles();
            setRoles(data || []);
        } catch (err) {
            setError(err.detail || 'Could not fetch roles.');
            setRoles([]);
        } finally {
            setIsLoadingRoles(false);
        }
    }, []);

    const fetchAllPermissions = useCallback(async () => {
        setIsLoadingPerms(true);
        setError(null);
        try {
            const data = await rolePermissionService.getAllPermissions();
            setPermissions(data || []);
        } catch (err) {
            setError(err.detail || 'Could not fetch permissions.');
            setPermissions([]);
        } finally {
            setIsLoadingPerms(false);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
        fetchAllPermissions();
    }, [fetchRoles, fetchAllPermissions]);

    // --- Role CRUD Handlers ---
    const handleEditRoleClick = (role) => {
        setEditingRole(role);
        setRoleName(role.name);
        setError(null);
    };

    const handleCancelEditRole = () => {
        setEditingRole(null);
        setRoleName('');
        setError(null);
    };

    const handleDeleteRole = async (roleId) => {
        if (!window.confirm('Are you sure you want to delete this role? This will unassign all users from this role.')) {
            return;
        }
        setError(null);
        try {
            await rolePermissionService.deleteRole(roleId);
            fetchRoles(); // Refresh role list
            if (selectedRoleId === roleId) {
                setSelectedRoleId(''); // Clear permission editor if deleted role was selected
                setCurrentRolePermissions(new Set());
            }
        } catch (err) {
            setError(err.detail || 'Failed to delete role.');
        }
    };

    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        if (!roleName.trim()) {
            setError('Role name cannot be empty.');
            return;
        }
        setIsSubmittingRole(true);
        setError(null);
        try {
            if (editingRole) {
                await rolePermissionService.updateRole(editingRole.id, { name: roleName });
            } else {
                await rolePermissionService.createRole({ name: roleName });
            }
            handleCancelEditRole();
            fetchRoles(); // Refresh list
        } catch (err) {
            setError(err.detail || (editingRole ? 'Failed to update role.' : 'Failed to create role.'));
        } finally {
            setIsSubmittingRole(false);
        }
    };

    // --- Permission Editing Handlers ---
    const handleRoleSelectChange = async (e) => {
        const roleId = e.target.value;
        setSelectedRoleId(roleId);
        setCurrentRolePermissions(new Set()); // Clear old permissions
        
        if (!roleId) {
            return;
        }

        setIsLoadingRolePerms(true);
        setError(null);
        try {
            // We fetch the single role, which should return its list of permissions
            const roleDetails = await rolePermissionService.getRoleDetails(roleId);
            const permissionIds = (roleDetails.permissions || []).map(p => p.id);
            setCurrentRolePermissions(new Set(permissionIds));
        } catch (err) {
            setError(err.detail || 'Failed to fetch permissions for this role.');
        } finally {
            setIsLoadingRolePerms(false);
        }
    };

    const handlePermissionCheckboxChange = (permissionId) => {
        setCurrentRolePermissions(prevSet => {
            const newSet = new Set(prevSet);
            if (newSet.has(permissionId)) {
                newSet.delete(permissionId);
            } else {
                newSet.add(permissionId);
            }
            return newSet;
        });
    };

    const handleSavePermissions = async () => {
        setIsSavingPerms(true);
        setError(null);
        try {
            const permissionIds = Array.from(currentRolePermissions);
            await rolePermissionService.updatePermissionsForRole(selectedRoleId, { permission_ids: permissionIds });
            // You could add a success message here
        } catch (err) {
            setError(err.detail || 'Failed to save permissions.');
        } finally {
            setIsSavingPerms(false);
        }
    };


    // --- JSX Rendering ---
    return (
        <div className="management-container p-4 md:p-6 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">🔐 Role & Permission Management</h2>

            {error && (
                <div className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">
                    {error}
                </div>
            )}

            {/* --- Card 1: Manage Roles (CRUD) --- */}
            <motion.div 
                layout
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
                <form onSubmit={handleRoleSubmit}>
                    <div className="p-4 md:p-5">
                        <h3 className="font-semibold text-lg text-gray-800 mb-3">
                            {editingRole ? `Editing "${editingRole.name}"` : 'Add New Role'}
                        </h3>
                        <div>
                            <label htmlFor="roleName" className="sr-only">Role Name</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    id="roleName"
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder="e.g., Librarian, Member"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    disabled={isSubmittingRole}
                                />
                                {editingRole && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEditRole}
                                        disabled={isSubmittingRole}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isSubmittingRole || !roleName.trim()}
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-indigo-400"
                                    style={{ minWidth: '120px' }}
                                >
                                    {isSubmittingRole ? <SpinnerIcon /> : (editingRole ? 'Update Role' : 'Add Role')}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="table-responsive">
                    {isLoadingRoles && <p className="text-center text-gray-500 p-6">Loading roles...</p>}
                    {!isLoadingRoles && roles.length === 0 && (
                        <p className="text-center text-gray-500 p-6">No roles found. Add one above to get started.</p>
                    )}
                    {!isLoadingRoles && roles.length > 0 && (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <AnimatePresence initial={false}>
                                    {roles.map(role => (
                                        <motion.tr key={role.id} variants={cardVariants} initial="hidden" animate="visible" exit="exit" layout>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{role.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <button onClick={() => handleEditRoleClick(role)} className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-100" title="Edit Name"><PencilIcon className="h-4 w-4" /></button>
                                                <button onClick={() => handleDeleteRole(role.id)} className="p-1.5 text-red-600 hover:text-red-800 rounded-md hover:bg-red-100" title="Delete Role"><TrashIcon className="h-4 w-4" /></button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>


            {/* --- Card 2: Manage Permissions --- */}
            <motion.div 
                layout
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
                <div className="p-4 md:p-5 border-b border-gray-200">
                    <h3 className="font-semibold text-lg text-gray-800 mb-3">Permissions by Role</h3>
                    <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-1">
                        Select a Role to Manage
                    </label>
                    <select
                        id="roleSelect"
                        value={selectedRoleId}
                        onChange={handleRoleSelectChange}
                        disabled={isLoadingRoles}
                        className="block w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                        <option value="">--- Select a Role ---</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>

                {/* Permissions Checkbox List */}
                <div className="p-4 md:p-5">
                    {!selectedRoleId && (
                        <p className="text-center text-gray-500 py-6">Please select a role above to view or edit its permissions.</p>
                    )}
                    
                    {selectedRoleId && (isLoadingRolePerms || isLoadingPerms) && (
                        <p className="text-center text-gray-500 py-6">Loading permissions...</p>
                    )}

                    {selectedRoleId && !isLoadingRolePerms && !isLoadingPerms && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {permissions.length === 0 && (
                                    <p className="text-gray-500 col-span-full">No permissions found in the system.</p>
                                )}

                                {permissions.map(perm => (
                                    <label key={perm.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={currentRolePermissions.has(perm.id)}
                                            onChange={() => handlePermissionCheckboxChange(perm.id)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">
                                            {perm.name}
                                            {/* Assuming your permission object has 'name' and 'codename' */}
                                            <span className="text-xs text-gray-400 block">({perm.codename || '...'})</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button Footer */}
                {selectedRoleId && !isLoadingRolePerms && !isLoadingPerms && permissions.length > 0 && (
                    <div className="bg-gray-50 px-4 py-3 flex justify-end">
                        <button
                            type="button"
                            onClick={handleSavePermissions}
                            disabled={isSavingPerms}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:bg-green-400"
                            style={{ minWidth: '160px' }}
                        >
                            {isSavingPerms ? <SpinnerIcon /> : <ShieldCheckIcon className="-ml-1 mr-1 h-4 w-4" />}
                            Save Permissions
                        </button>
                    </div>
                )}
            </motion.div>

        </div>
    );
};

export default RolePermissionManagement;