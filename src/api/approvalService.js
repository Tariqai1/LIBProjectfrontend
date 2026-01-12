// src/api/approvalService.js
import apiClient from './apiClient';

/**
 * Fetches all approval requests. Can be filtered by status.
 * @param {string|null} statusFilter - Optional status ('Pending', 'Approved', 'Rejected').
 * @returns {Promise<Array>} List of request objects.
 */
const getAllRequests = async (statusFilter = null) => {
    try {
        let endpoint = '/api/requests/';
        if (statusFilter) {
            // Ensure backend endpoint supports this filter key, e.g., 'status_filter'
            endpoint += `?status_filter=${statusFilter}`;
        }
        const response = await apiClient.get(endpoint);
        return response.data;
    } catch (error) {
        console.error("Error fetching approval requests:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch approval requests');
    }
};

/**
 * Submits a review (Approve/Reject) for a request.
 * @param {number} requestId - The ID of the request to review.
 * @param {'Approved' | 'Rejected'} status - The review status.
 * @param {string} [remarks] - Optional remarks for the review.
 * @returns {Promise<object>} The updated request object.
 */
const reviewRequest = async (requestId, status, remarks = '') => {
    try {
        const payload = { status, remarks };
        // Ensure this endpoint matches your FastAPI backend
        const response = await apiClient.put(`/api/requests/${requestId}/review`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error reviewing request ${requestId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to submit review');
    }
};

// Make sure to use the correct named export
export const approvalService = {
    getAllRequests,
    reviewRequest,
};