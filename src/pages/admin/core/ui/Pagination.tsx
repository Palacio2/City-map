import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, totalItems }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-surface border-t border-border">
            <span className="text-xs text-textMuted">
                {totalItems !== undefined && (
                    <>Всього: <strong>{totalItems}</strong> записів</>
                )}
            </span>
            <div className="flex gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-border text-textMuted hover:text-textMain hover:bg-main disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaChevronLeft className="text-xs" />
                </button>
                <span className="text-xs font-semibold px-3 py-1.5 text-textMain">
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-border text-textMuted hover:text-textMain hover:bg-main disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaChevronRight className="text-xs" />
                </button>
            </div>
        </div>
    );
};