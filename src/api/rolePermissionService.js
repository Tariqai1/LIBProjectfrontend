// src/api/rolePermissionService.js
import apiClient from './apiClient';

/**
 * --- VVIP NOTE ---
 * URLs adjusted based on backend controller structure.
 * Role URLs are under /api/users/roles/
 * Permission URLs are under /api/permissions/permissions/
 * Assigning permissions to roles uses POST to /api/permissions/roles/{id}/permissions
 */

export const rolePermissionService = {

    // --- Role CRUD ---

    /** API Endpoint: GET /api/users/roles/ */
    async getAllRoles() {
        try {
            // Using trailing slash as FastAPI often redirects if missing/extra
            const response = await apiClient.get('/api/users/roles/');
            return response.data;
        } catch (error) {
            console.error('Error fetching roles:', error.response?.data);
            const detail = error.response?.data?.detail || 'Network error or Role endpoint not found (404)';
            throw { detail: detail };
        }
    },

    /** API Endpoint: GET /api/users/roles/{id}/ (Assumed) */
    async getRoleDetails(roleId) {
        try {
            const response = await apiClient.get(`/api/users/roles/${roleId}/`);
            return response.data;
        } catch (error) {
             console.error(`Error fetching role ${roleId} details:`, error.response?.data);
             const detail = error.response?.data?.detail || 'Network error or Role detail endpoint not found (404)';
             throw { detail: detail };
        }
    },

    /** API Endpoint: POST /api/users/roles/ */
    async createRole(roleData) {
        try {
            const response = await apiClient.post('/api/users/roles/', roleData);
            return response.data;
        } catch (error) {
            console.error('Error creating role:', error.response?.data);
            const detail = error.response?.data?.detail || 'Network error or Role creation failed';
            throw { detail: detail };
        }
    },

    /** API Endpoint: PUT /api/users/roles/{id}/ (Assumed) */
    async updateRole(roleId, roleData) {
        try {
            const response = await apiClient.put(`/api/users/roles/${roleId}/`, roleData);
            return response.data;
        } catch (error) {
            console.error(`Error updating role ${roleId}:`, error.response?.data);
            const detail = error.response?.data?.detail || 'Network error or Role update failed';
            throw { detail: detail };
         }
    },

    /** API Endpoint: DELETE /api/users/roles/{id}/ (Assumed) */
    async deleteRole(roleId) {
        try {
            const response = await apiClient.delete(`/api/users/roles/${roleId}/`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting role ${roleId}:`, error.response?.data);
            const detail = error.response?.data?.detail || 'Network error or Role deletion failed';
            throw { detail: detail };
        }
    },

    // --- Permission Management ---

    /** API Endpoint: GET /api/permissions/permissions/ */
    async getAllPermissions() {
        try {
            // Using trailing slash as FastAPI often redirects if missing/extra
            const response = await apiClient.get('/api/permissions/permissions/');
            return response.data;
        } catch (error) {
            console.error('Error fetching all permissions:', error.response?.data);
            const detail = error.response?.data?.detail || 'Network error or Permissions endpoint not found (404)';
            throw { detail: detail };
        }
    },

    /**
     * Ek role ke permissions ko update/set karta hai
     * API Endpoint: POST /api/permissions/roles/{id}/permissions <-- CORRECTED METHOD & URL
     */
    async updatePermissionsForRole(roleId, permissionIdsObject) {
        // permissionIdsObject = { permission_ids: [1, 2, 5] }
        try {
            // --- FIX: Use POST instead of PUT ---
            // --- FIX: Removed trailing slash to match redirect target ---
            const response = await apiClient.post(`/api/permissions/roles/${roleId}/permissions`, permissionIdsObject);
            return response.data;
        } catch (error) {
            console.error('Error updating permissions:', error.response?.data);
            const detail = error.response?.data?.detail || 'Network error or updating permissions failed (405?)';
            throw { detail: detail };
        }
    }
};