import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

export const DataTable = ({
  columns,
  data = [],
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchKey = '',
  emptyMessage = 'No data available',
  pagination = true,
  pageSize = 10,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (searchKey) {
      return String(item[searchKey] || '').toLowerCase().includes(term);
    }
    return Object.values(item).some((val) =>
      String(val).toLowerCase().includes(term)
    );
  });

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0;
    const valA = a[sortKey];
    const valB = b[sortKey];

    if (valA === valB) return 0;
    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }

    return sortOrder === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA));
  });

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900/60 light:bg-slate-50 border border-slate-700/60 light:border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 light:text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>
          <div className="text-xs text-slate-400">
            Showing {filteredData.length} of {data.length} entries
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-700/60 light:border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 light:bg-slate-100 text-slate-400 light:text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-700/60 light:border-slate-200">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable !== false && col.key && handleSort(col.key)}
                  className={`px-4 py-3 ${col.sortable !== false && col.key ? 'cursor-pointer select-none hover:text-brand-400' : ''} ${col.headerClassName || ''}`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {sortKey === col.key && (
                      sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-brand-400" /> : <ChevronDown className="w-3.5 h-3.5 text-brand-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40 light:divide-slate-200 bg-slate-800/40 light:bg-white text-slate-200 light:text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-700/30 light:hover:bg-slate-50 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3 ${col.className || ''}`}>
                      {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-slate-700/50 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 disabled:opacity-40 rounded transition-colors text-slate-200 light:text-slate-800"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-slate-700/50 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 disabled:opacity-40 rounded transition-colors text-slate-200 light:text-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
