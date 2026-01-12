// src/components/book/BookForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { bookService } from '../../api/bookService'; 
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/20/solid';

// Spinner Icon
const SpinnerIcon = ({ className = "text-white" }) => (
    <svg className={`animate-spin -ml-0.5 mr-2 h-4 w-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Error object ko string mein badalne ke liye helper ---
const parseApiErrorToString = (error) => {
    // Axios Network Error ya server crash
    if (error.message === 'Network Error' || !error.detail) {
      return 'Network Error: Could not connect to the server. Is it running?';
    }
    // FastAPI/Pydantic validation error (List of dicts)
    if (Array.isArray(error.detail)) {
      try {
        const firstError = error.detail[0];
        const field = firstError.loc ? firstError.loc.slice(1).join(' -> ') : 'Input'; // Remove 'body' prefix
        const msg = firstError.msg || 'Invalid data';
        // Sanitize msg just in case it contains bad characters
        const cleanMsg = String(msg).replace(/[^\x20-\x7E]/g, ''); 
        return `${field}: ${cleanMsg}`;
      } catch {
        return 'Validation Error: Invalid data format received.'; // Fallback
      }
    }
    // Django REST Framework error (Dict of lists)
    if (typeof error.detail === 'object' && error.detail !== null) {
      try {
        const firstKey = Object.keys(error.detail)[0];
        const firstMessage = Array.isArray(error.detail[firstKey]) ? error.detail[firstKey][0] : String(error.detail[firstKey]);
        const cleanMsg = String(firstMessage).replace(/[^\x20-\x7E]/g, '');
        return `${firstKey}: ${cleanMsg}`;
      } catch {
         return 'Validation Error: Invalid data format received.'; // Fallback
      }
    }
    // Simple string error
    if (typeof error.detail === 'string') {
      return error.detail.replace(/[^\x20-\x7E]/g, '');
    }
    // Fallback for unexpected errors
    return String(error.message || 'An unknown error occurred.').replace(/[^\x20-\x7E]/g, '');
};


const BookForm = ({ onBookAdded, onBookUpdated, initialData = null, isEditing = false }) => {

    // --- FIX: Sabhi fields ko default value dein ---
    const getInitialState = useCallback(() => ({
        title: initialData?.title || '',
        author: initialData?.author || '',
        publisher: initialData?.publisher || '',
        translator: initialData?.translator || '',
        publication_year: initialData?.publication_year || '',
        edition: initialData?.edition || '',
        isbn: initialData?.isbn || '',
        pages: initialData?.pages || '',
        parts_or_volumes: initialData?.parts_or_volumes || '',
        language_id: initialData?.language?.id || '', // REQUIRED
        subcategory_ids: initialData?.subcategories?.map(sub => sub.id) || [],
        serial_number: initialData?.serial_number || '',
        book_number: initialData?.book_number || '',
        subject_number: initialData?.subject_number || '',
        price: initialData?.price || '',
        date_of_purchase: initialData?.date_of_purchase ? initialData.date_of_purchase.split('T')[0] : '',
        remarks: initialData?.remarks || '',
        description: initialData?.description || '',
        is_digital: initialData?.is_digital || false,
        is_restricted: initialData?.is_restricted || false,
        // File URLs ko state mein rakhna zaroori nahi, initialData se check kar sakte hain
        // cover_image_url: initialData?.cover_image_url || '', 
        // pdf_url: initialData?.pdf_url || '',
    }), [initialData]);

    const [formData, setFormData] = useState(getInitialState());
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [pdfFile, setPdfFile] = useState(null);
    const [languages, setLanguages] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownLoading, setIsDropdownLoading] = useState(true);
    const [error, setError] = useState(null); // Ab string store hoga
    const [successMessage, setSuccessMessage] = useState(null);

    // Fetch dropdowns
    useEffect(() => {
        const fetchData = async () => {
            setIsDropdownLoading(true);
            try {
                const [langData, subcatData] = await Promise.all([
                    bookService.getAllLanguages(),
                    bookService.getAllSubcategories(),
                ]);
                setLanguages(langData || []);
                setSubcategories(subcatData || []);
            } catch (err) {
                console.error('Dropdown fetch error:', err);
                setError(parseApiErrorToString(err)); 
            } finally {
                setIsDropdownLoading(false);
            }
        };
        fetchData();
    }, []);

    // Reset form
    useEffect(() => { 
        setFormData(getInitialState()); 
        setCoverImageFile(null);
        setPdfFile(null);
        setError(null);
        setSuccessMessage(null);
    }, [initialData, getInitialState]);

    // Input Handlers
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handleSubcategoryChange = (e) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => Number(option.value));
        setFormData(prev => ({ ...prev, subcategory_ids: selectedIds }));
    };
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) {
            if (name === 'coverImageFile') setCoverImageFile(files[0]);
            else if (name === 'pdfFile') setPdfFile(files[0]);
        } else {
             if (name === 'coverImageFile') setCoverImageFile(null);
             else if (name === 'pdfFile') setPdfFile(null);
        }
    };

    // --- Submit Handler (Data Cleaning + Error Parsing) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        // **Basic Frontend Validation**
        if (!formData.title) { setError('Title is required.'); return; }
        if (!formData.language_id) { setError('Language is required.'); return; } // Ensure language is selected
        
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        const dataToSubmit = new FormData();
        
        // **Data Cleaning before sending**
        Object.keys(formData).forEach(key => {
            // Arrays aur URLs ko alag handle karein (backend model mein define nahi hote)
            if (key === 'subcategory_ids' || key === 'cover_image_url' || key === 'pdf_url') return;
            
            let value = formData[key];
            
            // Convert empty optional strings to null (Backend ko null=True/Optional chahiye)
            const optionalStringFields = ['author', 'publisher', 'translator', 'edition', 'isbn', 'parts_or_volumes', 'serial_number', 'book_number', 'subject_number', 'remarks', 'description'];
            if (optionalStringFields.includes(key) && value === '') {
                value = null; // Backend None/null expect karega
            }

            // Convert empty optional numbers/date to null
            const optionalNumericFields = ['publication_year', 'pages', 'price', 'date_of_purchase'];
             if (optionalNumericFields.includes(key) && value === '') {
                value = null; // Backend None/null expect karega
            }

            // Append cleaned value if not null
            if (value !== null) {
               dataToSubmit.append(key, value);
            }
        });

        // Append arrays
        formData.subcategory_ids.forEach(id => dataToSubmit.append('subcategory_ids', id));

        // Append files if they exist
        if (coverImageFile) dataToSubmit.append('cover_image', coverImageFile);
        if (pdfFile) dataToSubmit.append('pdf_file', pdfFile);

        // --- API Call ---
        try {
            let resultBook;
            if (isEditing) {
                resultBook = await bookService.updateBook(initialData.id, dataToSubmit);
                setSuccessMessage('Book updated successfully!');
                onBookUpdated(resultBook);
            } else {
                resultBook = await bookService.createBook(dataToSubmit);
                // Approval request ko optional banayein (agar fail ho toh bhi book add ho)
                try {
                   await bookService.createApprovalRequest(resultBook.id);
                   setSuccessMessage('Book added successfully! Approval request created.');
                } catch (approvalError) {
                   console.warn("Approval request failed:", approvalError);
                   setSuccessMessage('Book added successfully! (Approval request failed)'); 
                }
                onBookAdded(resultBook);
                setFormData(getInitialState()); // Reset form only on successful creation
                setCoverImageFile(null);
                setPdfFile(null);
                // Clear file inputs visually (if possible)
                if (document.getElementById('coverImageFile')) document.getElementById('coverImageFile').value = null;
                if (document.getElementById('pdfFile')) document.getElementById('pdfFile').value = null;
            }
        } catch (err) {
            // Error ko parse karke string banayein
            console.error('Submission error object:', err); // Log the raw error object
            setError(parseApiErrorToString(err)); 
        } finally {
            setIsLoading(false);
        }
    };

    // --- Tailwind Classes ---
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const buttonClass = `inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`;
    const primaryButtonClass = `${buttonClass} bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ab {error} hamesha ek string hoga */}
            {error && <p className="p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">{error}</p>}
            {successMessage && <p className="p-3 bg-green-100 border border-green-300 text-green-700 text-sm rounded-md text-center">{successMessage}</p>}

            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-6">
                
                {/* --- Core Details --- */}
                <div className="sm:col-span-3">
                    <label htmlFor="title" className={labelClass}>Title *</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required className={inputClass} disabled={isLoading} />
                </div>
                <div className="sm:col-span-3">
                    <label htmlFor="author" className={labelClass}>Author / Compiler</label>
                    <input type="text" id="author" name="author" value={formData.author} onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
                <div className="sm:col-span-3">
                    <label htmlFor="publisher" className={labelClass}>Publisher / Press</label>
                    <input type="text" id="publisher" name="publisher" value={formData.publisher} onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
                 <div className="sm:col-span-3">
                    <label htmlFor="translator" className={labelClass}>Translator / Editor</label>
                    <input type="text" id="translator" name="translator" value={formData.translator} onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="publication_year" className={labelClass}>Year</label>
                    <input type="number" id="publication_year" name="publication_year" placeholder="e.g., 2023" value={formData.publication_year} onChange={handleChange} className={inputClass} min="1000" max={new Date().getFullYear() + 5} disabled={isLoading} />
                </div>
                 <div className="sm:col-span-2">
                    <label htmlFor="edition" className={labelClass}>Edition</label>
                    <input type="text" id="edition" name="edition" placeholder="e.g., 1st, Revised" value={formData.edition} onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
                 <div className="sm:col-span-2">
                    <label htmlFor="isbn" className={labelClass}>ISBN</label>
                    <input type="text" id="isbn" name="isbn" value={formData.isbn} onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
                 <div className="sm:col-span-2">
                    <label htmlFor="pages" className={labelClass}>Pages</label>
                    <input type="number" id="pages" name="pages" value={formData.pages} onChange={handleChange} className={inputClass} min="1" disabled={isLoading} />
                </div>
                 <div className="sm:col-span-2">
                    <label htmlFor="parts_or_volumes" className={labelClass}>Parts/Volumes</label>
                    <input type="text" id="parts_or_volumes" name="parts_or_volumes" placeholder="e.g., Vol. 1" value={formData.parts_or_volumes} onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
                 <div className="sm:col-span-2">
                    <label htmlFor="language_id" className={labelClass}>Language *</label>
                    <select id="language_id" name="language_id" value={formData.language_id} onChange={handleChange} required className={inputClass} disabled={isDropdownLoading}>
                        <option value="">{isDropdownLoading ? 'Loading...' : 'Select Language'}</option>
                        {languages.map((lang) => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
                    </select>
                </div>
                
                {/* --- Classification --- */}
                <div className="sm:col-span-6">
                    <label htmlFor="subcategory_ids" className={labelClass}>Subcategories</label>
                    <select id="subcategory_ids" name="subcategory_ids" multiple value={formData.subcategory_ids} onChange={handleSubcategoryChange} size="5" className={inputClass} disabled={isDropdownLoading}>
                        {isDropdownLoading && <option disabled>Loading...</option>}
                        {subcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                                {sub.category?.name || '...'} - {sub.name}
                            </option>
                        ))}
                    </select>
                    <small className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</small>
                </div>

                {/* --- Library Details --- */}
                 <div className="sm:col-span-2">
                    <label htmlFor="subject_number" className={labelClass}>Subject No.</label>
                    <input type="text" id="subject_number" name="subject_number" value={formData.subject_number} onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
                 <div className="sm:col-span-2">
                    <label htmlFor="serial_number" className={labelClass}>Serial No.</label>
                    <input type="text" id="serial_number" name="serial_number" value={formData.serial_number} onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="book_number" className={labelClass}>Book No.</label>
                    <input type="text" id="book_number" name="book_number" value={formData.book_number} onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
                 <div className="sm:col-span-3">
                    <label htmlFor="price" className={labelClass}>Price</label>
                    <input type="number" step="0.01" id="price" name="price" value={formData.price} onChange={handleChange} min="0" className={inputClass} disabled={isLoading} />
                </div>
                 <div className="sm:col-span-3">
                    <label htmlFor="date_of_purchase" className={labelClass}>Purchase Date</label>
                    <input type="date" id="date_of_purchase" name="date_of_purchase" value={formData.date_of_purchase} onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>

                {/* --- Textareas --- */}
                 <div className="sm:col-span-6">
                    <label htmlFor="description" className={labelClass}>Description</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3" className={inputClass} disabled={isLoading}></textarea>
                </div>
                 <div className="sm:col-span-6">
                    <label htmlFor="remarks" className={labelClass}>Remarks / Condition</label>
                    <textarea id="remarks" name="remarks" value={formData.remarks} onChange={handleChange} rows="3" className={inputClass} disabled={isLoading}></textarea>
                </div>

                {/* --- File Inputs --- */}
                 <div className="sm:col-span-3">
                    <label htmlFor="coverImageFile" className={labelClass}>Cover Image</label>
                    <input type="file" id="coverImageFile" name="coverImageFile" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className={`${inputClass} p-0 border-none shadow-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100`} disabled={isLoading} />
                     {coverImageFile && <small className="text-xs text-gray-500 mt-1">New: {coverImageFile.name}</small>}
                     {isEditing && initialData?.cover_image_url && !coverImageFile && // Check initialData directly
                        <small className="text-xs text-gray-500 mt-1">Current: <a href={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}${initialData.cover_image_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a></small>
                     }
                </div>
                 <div className="sm:col-span-3">
                    <label htmlFor="pdfFile" className={labelClass}>Book PDF</label>
                    <input type="file" id="pdfFile" name="pdfFile" accept="application/pdf" onChange={handleFileChange} className={`${inputClass} p-0 border-none shadow-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100`} disabled={isLoading} />
                     {pdfFile && <small className="text-xs text-gray-500 mt-1">New: {pdfFile.name}</small>}
                     {isEditing && initialData?.pdf_url && !pdfFile && // Check initialData directly
                        <small className="text-xs text-gray-500 mt-1">Current: <a href={`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}${initialData.pdf_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View PDF</a></small>
                      }
                </div>

                {/* --- Checkboxes --- */}
                 <div className="sm:col-span-6 mt-2 space-y-2">
                    <div className="flex items-center">
                        <input id="is_restricted" name="is_restricted" type="checkbox" checked={formData.is_restricted} onChange={handleChange} disabled={isLoading} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                        <label htmlFor="is_restricted" className="ml-2 block text-sm text-gray-900">Is Restricted? (Users must request access)</label>
                    </div>
                     <div className="flex items-center">
                        <input id="is_digital" name="is_digital" type="checkbox" checked={formData.is_digital} onChange={handleChange} disabled={isLoading} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                        <label htmlFor="is_digital" className="ml-2 block text-sm text-gray-900">Is Digital? (Digital copy only)</label>
                    </div>
                </div>

            </div> {/* End grid */}

            {/* Modal Actions */}
            <div className="pt-5 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                    <button type="submit" className={primaryButtonClass} disabled={isLoading || isDropdownLoading}>
                        {isLoading ? <SpinnerIcon /> : (isEditing ? <ArrowPathIcon className="-ml-1 mr-1 h-4 w-4" /> : <PlusIcon className="-ml-1 mr-1 h-4 w-4" />)}
                        {isLoading ? 'Saving...' : (isEditing ? 'Update Book' : 'Add Book')}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default BookForm;