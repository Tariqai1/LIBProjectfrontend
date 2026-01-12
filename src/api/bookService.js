// src/api/bookService.js
import apiClient from './apiClient';

/**
 * --- VVIP NOTE ---
 * Added trailing slashes '/' to most URLs assuming a Django/DRF backend.
 * If you still get 404 errors (especially for languages/subcategories),
 * **verify these URLs exactly match your backend urls.py definitions.**
 */

/**
 * Fetches all books from the API.
 * @param {boolean} [approvedOnly=true] - If true, fetches only approved books.
 * @returns {Promise<Array>} Array of book objects.
 * API Endpoint: GET /api/books/
 */
const getAllBooks = async (approvedOnly = true) => {
  try {
    // Note: Query parameters don't usually need a trailing slash in the base URL
    const response = await apiClient.get('/api/books/', { 
        params: { approved_only: approvedOnly } 
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching books:", error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch books');
  }
};

/**
 * Fetches details for a single book by its ID.
 * @param {number|string} bookId - The ID of the book.
 * @returns {Promise<object>} The detailed book object.
 * API Endpoint: GET /api/books/{id}/
 */
const getBookById = async (bookId) => {
    try {
        const response = await apiClient.get(`/api/books/${bookId}/`); // Added trailing slash
        return response.data;
    } catch (error) {
        console.error(`Error fetching book ${bookId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to fetch book details');
    }
};


/**
 * Creates a new book entry via the API, including file uploads.
 * @param {FormData} formData - The FormData object containing book data and potentially files.
 * @returns {Promise<object>} The newly created book object.
 * API Endpoint: POST /api/books/
 */
const createBook = async (formData) => {
  try {
    const response = await apiClient.post('/api/books/', formData, { // Added trailing slash
      headers: {
        // Axios typically sets this automatically for FormData, but being explicit is okay
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating book:", error.response?.data || error.message);
    // Re-throw the detailed error from the backend (important for 422 errors)
    throw error.response?.data || new Error('Failed to create book');
  }
};

/**
 * Updates an existing book entry via the API, including file uploads.
 * @param {number|string} bookId - The ID of the book to update.
 * @param {FormData} formData - The FormData object containing updated book data and potentially files.
 * @returns {Promise<object>} The updated book object.
 * API Endpoint: PUT /api/books/{id}/
 */
const updateBook = async (bookId, formData) => {
    try {
        // Note: Django might need specific handling for PUT with multipart/form-data.
        // If PUT fails, consider if your backend expects POST for updates involving files.
        const response = await apiClient.put(`/api/books/${bookId}/`, formData, { // Added trailing slash
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating book ${bookId}:`, error.response?.data || error.message);
        // Re-throw the detailed error
        throw error.response?.data || new Error('Failed to update book');
    }
};

/**
 * Deletes (soft deletes) a book via the API.
 * @param {number|string} bookId - The ID of the book to delete.
 * @returns {Promise<object>} Confirmation message.
 * API Endpoint: DELETE /api/books/{id}/
 */
const deleteBook = async (bookId) => {
    try {
        const response = await apiClient.delete(`/api/books/${bookId}/`); // Added trailing slash
        // DELETE often returns 204 No Content
        return response.data || { detail: "Book deleted successfully" };
    } catch (error) {
        console.error(`Error deleting book ${bookId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error('Failed to delete book');
    }
};

/**
 * Fetches all languages from the API.
 * @returns {Promise<Array>} List of language objects.
 * API Endpoint: GET /api/languages/
 * VVIP: CHECK THIS URL AGAINST YOUR BACKEND `urls.py` if 404 occurs.
 */
const getAllLanguages = async () => {
  try {
    const response = await apiClient.get('/api/languages/'); // Added trailing slash
    return response.data;
  } catch (error) {
    console.error("Error fetching languages:", error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch languages (404?)');
  }
};

/**
 * Fetches all subcategories from the API.
 * @returns {Promise<Array>} List of subcategory objects.
 * API Endpoint: GET /api/subcategories/
 * VVIP: CHECK THIS URL AGAINST YOUR BACKEND `urls.py` if 404 occurs.
 */
const getAllSubcategories = async () => {
  try {
    const response = await apiClient.get('/api/subcategories/'); // Added trailing slash
    return response.data;
  } catch (error) {
    console.error("Error fetching subcategories:", error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch subcategories (404?)');
  }
};

/**
 * Creates an approval request for a newly created book.
 * @param {number} bookId - The ID of the book requiring approval.
 * @returns {Promise<object|null>} The created request object or null.
 * API Endpoint: POST /api/requests/ (Using your previous code's URL)
 * VVIP: Verify this URL ('/api/requests/' vs '/api/approvals/') against your backend.
 */
const createApprovalRequest = async (bookId) => {
    try {
        // Using the URL from your original code
        const response = await apiClient.post('/api/requests/', { book_id: bookId }); // Added trailing slash
        return response.data;
    } catch (error) {
        // Log error but don't prevent book creation success message
        console.error("Error creating approval request:", error.response?.data || error.message);
        console.warn('Failed to create approval request automatically.');
        return null; // Return null on failure
    }
};


// --- Removed uploadImage and uploadPdf ---
// These are no longer needed as files are sent directly with createBook/updateBook using FormData.


// --- Named Export ---
// Export all functions within the bookService object
export const bookService = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  // uploadImage, // Removed
  // uploadPdf,   // Removed
  getAllLanguages,
  getAllSubcategories,
  createApprovalRequest,
};