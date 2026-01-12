// src/pages/BookDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookService } from '../api/bookService'; // To fetch book data

// --- NEW: react-pdf-viewer Imports ---
// Import the main viewer component
import { Viewer, Worker } from '@react-pdf-viewer/core';
// Import the styles
import '@react-pdf-viewer/core/lib/styles/index.css';
// Import the default layout plugin (adds thumbnails, zoom, print, etc.)
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
// Import the styles for the default layout
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
// --- End Imports ---

// Helper function to get the full API base URL
const getStaticUrl = (relativePath) => {
    if (!relativePath) return null;
    // Vite uses import.meta.env.VITE_... for environment variables
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    return `${baseUrl}${relativePath}`;
}

// --- Helper component to render key-value pairs ---
// This component renders a label and value, skipping if the value is empty
const InfoItem = ({ label, value, fullWidth = false }) => {
    // Don't render the item if the value is empty, null, or undefined
    if (!value && typeof value !== 'number') return null; 
    
    return (
        <div className={fullWidth ? "md:col-span-2" : "md:col-span-1"}> {/* Span 2 columns if fullWidth */}
            <dt className="font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-gray-900 break-words">{value}</dd> {/* break-words for long text */}
        </div>
    );
};
// --- End Helper Component ---


const BookDetail = () => {
    const { id } = useParams(); // Get book ID from the URL
    const [book, setBook] = useState(null); // State to hold the fetched book data
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Create the Default Layout plugin instance ---
    // This needs to be stable, so we can define it outside or memoize it
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    // ---

    // --- Data Fetching ---
    useEffect(() => {
        const fetchBookDetails = async () => {
            if (!id) return; // Don't fetch if ID is missing
            setIsLoading(true);
            setError(null);
            try {
                // Call the API service to get book details
                const data = await bookService.getBookById(id);
                setBook(data); // Store the fetched book data in state
            } catch (err) {
                setError(err.detail || `Could not fetch details for book ID ${id}.`);
            } finally {
                setIsLoading(false); // Stop loading indicator
            }
        };

        fetchBookDetails();
    }, [id]); // Re-run this effect if the ID in the URL changes

    // --- Loading/Error/Not Found States ---
    if (isLoading) {
        return <div className="p-6 text-center text-gray-500">Loading book details...</div>;
    }
    if (error) {
        // Display error message if fetch failed
        return <div className="p-6 error-message bg-red-100 text-red-700 p-4 rounded">{error}</div>;
    }
    if (!book) {
        // Display if book is not found
        return <div className="p-6 text-center text-lg font-medium">Book not found.</div>;
    }

    // --- Prepare URLs ---
    // Get full URLs for the cover image and PDF file
    const coverImageUrl = getStaticUrl(book.cover_image_url);
    const pdfUrl = getStaticUrl(book.pdf_url);

    // --- JSX Rendering ---
    return (
        <div className="p-4 md:p-6 space-y-6"> {/* Main container */}
            {/* Back to List Link */}
            <Link to="/books" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                ← Back to Book List
            </Link>

            {/* Header Card: Title and Author */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{book.title}
                    <span className="text-base text-gray-500 font-normal ml-2">(ID: {book.id})</span>
                </h2>
                <p className="text-lg text-gray-600 mt-1">by {book.author || 'Unknown Author'}</p>
            </div>

            {/* Details Grid: 1 column on mobile, 3 on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Image & PDF Link */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Cover Image Card */}
                    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-center">
                        {coverImageUrl ? (
                            <img src={coverImageUrl} alt={`Cover for ${book.title}`} className="w-full h-auto object-cover rounded-md shadow-sm" />
                        ) : (
                            <div className="h-64 flex items-center justify-center bg-gray-100 text-gray-400 rounded-md">
                                (No Cover Image)
                            </div>
                        )}
                    </div>
                     {/* PDF Link Button (Opens in new tab) */}
                     {pdfUrl && (
                        <a
                            href={pdfUrl}
                            target="_blank" // Open in new tab
                            rel="noopener noreferrer"
                            className="block w-full text-center px-4 py-3 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 transition-colors"
                        >
                            View PDF in New Tab 📄
                        </a>
                    )}
                     {!pdfUrl && (
                         <div className="text-center p-4 bg-gray-100 text-gray-500 rounded-md text-sm">
                            No PDF file uploaded for this book.
                         </div>
                     )}
                </div>

                {/* Right Column: All Text Details */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-3 mb-4">Book Details</h3>
                    {/* Definition List (dl) for details, responsive grid */}
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        
                        {/* --- Core Details --- */}
                        <InfoItem label="Author" value={book.author} />
                        <InfoItem label="Publisher" value={book.publisher} />
                        <InfoItem label="Publication Year" value={book.publication_year} />
                        <InfoItem label="Edition" value={book.edition} />
                        <InfoItem label="ISBN" value={book.isbn} />
                        <InfoItem label="Language" value={book.language?.name} />
                        <InfoItem label="Pages" value={book.pages} />
                        <InfoItem label="Parts/Volumes" value={book.parts_or_volumes} />
                        <InfoItem label="Subcategories" value={book.subcategories?.map(s => s.name).join(', ') || 'None'} />

                        {/* --- Library Details --- */}
                        <InfoItem label="Serial Number" value={book.serial_number} />
                        <InfoItem label="Book Number" value={book.book_number} />
                        <InfoItem label="Subject Number" value={book.subject_number} />
                        <InfoItem label="Price" value={book.price ? `$${book.price}` : null} />
                        <InfoItem label="Purchase Date" value={book.date_of_purchase ? new Date(book.date_of_purchase).toLocaleDateString() : null} />
                        <InfoItem label="Translator" value={book.translator} />

                        {/* --- Status Badges --- */}
                        <div className="md:col-span-1">
                            <dt className="font-medium text-gray-500">Status</dt>
                            <dd className="mt-1 flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${book.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {book.is_approved ? 'Approved' : 'Pending'}
                                </span>
                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${book.is_restricted ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {book.is_restricted ? 'Restricted' : 'Public'}
                                </span>
                            </dd>
                        </div>

                        {/* --- Long Text Fields (Description, Remarks) --- */}
                        <InfoItem label="Description" value={book.description} fullWidth />
                        <InfoItem label="Remarks/Condition" value={book.remarks} fullWidth />
                    </dl>
                </div>
            </div>

            {/* --- Embedded PDF Viewer Section (Using react-pdf-viewer) --- */}
            {pdfUrl && (
                <div className="pdf-viewer-section bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">PDF Viewer</h3>
                    
                    {/* The Worker component loads the PDF.js engine from a CDN (unpkg) */}
                    {/* This avoids the "pdf.worker.min.js" file copy issue */}
                    <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                        <div className="h-[75vh] w-full border border-gray-300 rounded-md">
                            {/* The Viewer component renders the PDF with the full UI */}
                            <Viewer
                                fileUrl={pdfUrl} // Pass the URL to the PDF file
                                plugins={[defaultLayoutPluginInstance]} // Apply the default UI (thumbnails, zoom, etc.)
                                theme="light" // Set theme
                            />
                        </div>
                    </Worker>
                </div>
            )}
            
        </div> // End main container
    );
};

// --- Make sure the default export is at the end ---
export default BookDetail;