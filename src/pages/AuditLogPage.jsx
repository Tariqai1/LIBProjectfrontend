// src/pages/AuditLogPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { logService } from '../api/logService';
import { ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
// import './ManagementPages.css'; // Assuming shared styles are global
// import './AuditLogPage.css'; // Assuming specific styles are global or in index.css

const AuditLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- State for Filters ---
    const [filterUserId, setFilterUserId] = useState('');
    const [filterActionType, setFilterActionType] = useState('');
    // State to hold the *applied* filters
    const [appliedFilters, setAppliedFilters] = useState({
        userId: '',
        actionType: ''
    });

    // --- State for Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25); // Number of logs per page
    const [hasNextPage, setHasNextPage] = useState(true); // Track if API might have more data

    // --- Tailwind Classes ---
    const inputClass = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";
    const buttonClass = `inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 whitespace-nowrap`;
    const primaryButtonClass = `${buttonClass} bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500`;
    const secondaryButtonClass = `inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 whitespace-nowrap`;
    const paginationButtonClass = "px-4 py-2 border border-gray-300 rounded-md bg-white text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";


    // --- Data Fetching ---
    // useCallback ensures this function ref changes only when its dependencies do
    const fetchLogs = useCallback(async (pageNumber, filters) => {
        setIsLoading(true);
        setError(null);

        const currentSkip = (pageNumber - 1) * itemsPerPage;

        try {
            const apiFilters = {
                limit: itemsPerPage,
                skip: currentSkip,
                userId: filters.userId ? parseInt(filters.userId) : undefined,
                actionType: filters.actionType || undefined,
            };
            
            const data = await logService.getLogs(apiFilters);

            setLogs(data || []); // Set logs for the current page
            setCurrentPage(pageNumber); // Update the current page
            
            // If we got less data than we asked for, there's no next page
            setHasNextPage((data || []).length === itemsPerPage);

        } catch (err) {
            setError(err.detail || 'Could not fetch audit logs.');
            setLogs([]); // Clear logs on error
        } finally {
            setIsLoading(false);
        }
    }, [itemsPerPage]); // itemsPerPage is constant, so this function is stable

    // Initial fetch and refetch when applied filters or page changes (via buttons)
    useEffect(() => {
        // This effect runs on mount and whenever appliedFilters changes
        fetchLogs(currentPage, appliedFilters);
    }, [appliedFilters, currentPage, fetchLogs]);

    // --- Event Handlers ---
    
    // Apply filters when form is submitted
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to page 1
        setAppliedFilters({ // Set the *applied* filters
            userId: filterUserId,
            actionType: filterActionType
        });
        // The useEffect above will trigger the refetch
    };

    // Clear filters and refetch
    const handleClearFilters = () => {
        setFilterUserId('');
        setFilterActionType('');
        setCurrentPage(1); // Reset to page 1
        setAppliedFilters({ // Set *applied* filters to empty
            userId: '',
            actionType: ''
        });
        // The useEffect above will trigger the refetch
    };

    // Pagination buttons
    const goToNextPage = () => {
        if (hasNextPage) {
            // We only change currentPage. The useEffect will detect this change.
            setCurrentPage(prev => prev + 1); 
        }
    };
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            // We only change currentPage. The useEffect will detect this change.
            setCurrentPage(prev => prev - 1);
        }
    };

    // --- JSX Rendering ---
    return (
        <div className="management-container p-4 md:p-6 space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">📜 Audit Logs</h2>

            {error && <p className="error-message p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-md text-center">{error}</p>}

            {/* --- Filter Controls --- */}
            <form onSubmit={handleFilterSubmit} className="filter-form bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                <div className="form-group flex-grow min-w-[150px]">
                    <label htmlFor="filterUserId" className={labelClass}>User ID:</label>
                    <input
                        type="number"
                        id="filterUserId"
                        value={filterUserId}
                        onChange={(e) => setFilterUserId(e.target.value)}
                        placeholder="e.g., 1"
                        className={inputClass}
                        disabled={isLoading}
                    />
                </div>
                <div className="form-group flex-grow min-w-[200px]">
                    <label htmlFor="filterActionType" className={labelClass}>Action Type:</label>
                    <input
                        type="text"
                        id="filterActionType"
                        value={filterActionType}
                        onChange={(e) => setFilterActionType(e.target.value)}
                        placeholder="e.g., BOOK_CREATED"
                        className={inputClass}
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" className={primaryButtonClass} disabled={isLoading}>
                    <MagnifyingGlassIcon className="h-5 w-5 mr-2" /> Apply Filters
                </button>
                 <button
                    type="button"
                    onClick={handleClearFilters}
                    className={secondaryButtonClass}
                    disabled={isLoading}
                 >
                    Clear Filters
                </button>
            </form>

            {/* --- Log List --- */}
            <div className="list-section bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                <div className="list-header flex justify-between items-center mb-4">
                    <h3 className="text-xl font-medium text-gray-800">System Activity</h3>
                    <button onClick={() => fetchLogs(currentPage, appliedFilters)} disabled={isLoading} className={secondaryButtonClass}>
                        <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
                
                {isLoading && <p className="text-center text-gray-500 py-4">Loading logs...</p>}
                {!isLoading && logs.length === 0 && <p className="text-center text-gray-500 py-4">No logs found matching criteria.</p>}

                {!isLoading && logs.length > 0 && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{log.action_by?.username || 'System/Unknown'} (ID: {log.action_by_id ?? 'N/A'})</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{log.action_type}</td>
                                            <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{log.target_type || '-'} (ID: {log.target_id ?? '-'})</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-sm break-words">{log.description || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* --- Pagination Controls --- */}
                        <div className="pagination-controls mt-4 pt-4 border-t border-gray-200 flex justify-center items-center gap-4">
                            <button onClick={goToPreviousPage} disabled={currentPage === 1 || isLoading} className={paginationButtonClass}>
                                Previous
                            </button>
                            <span className="text-sm font-medium text-gray-700">Page {currentPage}</span>
                            <button onClick={goToNextPage} disabled={!hasNextPage || isLoading} className={paginationButtonClass}>
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuditLogPage;