// src/api/locationService.js
import apiClient from './apiClient';

/**
 * Fetches all locations.
 * @returns {Promise<Array>} List of location objects.
 */
const getAllLocations = async () => {
    try {
        const response = await apiClient.get('/api/locations/');
        return response.data;
    } catch (error) {
        console.error("Error fetching locations:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch locations');
    }
};

/**
 * Creates a new location.
 * @param {object} locationData - { name: string, room_name?: string, shelf_number?: string, section_name?: string, description?: string }.
 * @returns {Promise<object>} The newly created location object.
 */
const createLocation = async (locationData) => {
    try {
        const response = await apiClient.post('/api/locations/', locationData);
        return response.data;
    } catch (error) {
        console.error("Error creating location:", error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to create location');
    }
};

/**
 * Updates an existing location.
 * (Assumes backend endpoint PUT /api/locations/{id} exists)
 * @param {number} locationId - The ID of the location to update.
 * @param {object} locationData - Updated location data.
 * @returns {Promise<object>} The updated location object.
 */
const updateLocation = async (locationId, locationData) => {
    try {
        const response = await apiClient.put(`/api/locations/${locationId}`, locationData);
        return response.data;
    } catch (error) {
        console.error(`Error updating location ${locationId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to update location');
    }
};

/**
 * Deletes a location.
 * (Assumes backend endpoint DELETE /api/locations/{id} exists)
 * @param {number} locationId - The ID of the location to delete.
 * @returns {Promise<object>} Confirmation message.
 */
const deleteLocation = async (locationId) => {
    try {
        const response = await apiClient.delete(`/api/locations/${locationId}`);
        // Handle 204 No Content response
        return response.data || { detail: "Location deleted successfully" };
    } catch (error) {
        console.error(`Error deleting location ${locationId}:`, error.response?.data || error.message);
         // Add specific error handling if backend prevents deleting used locations
         if (error.response?.status === 400 /* or specific code */) {
             throw new Error('Cannot delete location: It might be associated with book copies.');
         }
        throw error.response?.data || new Error('Failed to delete location');
    }
};

// Ensure correct named export
export const locationService = {
    getAllLocations,
    createLocation,
    updateLocation,
    deleteLocation,
};