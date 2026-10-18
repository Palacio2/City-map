import React from 'react';

export interface Column<T extends object = Record<string, unknown>> {
    header: React.ReactNode;
    accessor?: keyof T;
    render?: (row: T) => React.ReactNode;
    className?: string;
    cellClassName?: string;
}

export interface DataTableProps<T extends object = Record<string, unknown>> {
    columns: Column<T>[];
    data: T[];
    emptyMessage: React.ReactNode;
    rowClassName?: (row: T) => string;
}

const DataTable = <T extends object>({ columns, data, emptyMessage, rowClassName }: DataTableProps<T>) => {
    return (
        <div className="w-full overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
            <table className="w-full border-collapse text-xs text-left">
                <thead>
                    <tr className="bg-main/70 border-b border-border">
                        {columns.map((col, index) => (
                            <th
                                key={index}
                                className={`px-4 py-3 text-textMuted font-bold uppercase tracking-wider text-[10px] sm:text-[11px] whitespace-nowrap select-none ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-12 px-4 text-textMuted italic font-normal bg-surface">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => {
                            const r = row as Record<string, unknown>;
                            const rowKey = (r.id as string | number | undefined) ||
                                           (r.district_id as string | number | undefined) ||
                                           (r.translation_key as string | number | undefined) ||
                                           rowIndex;
                            return (
                                <tr
                                    key={String(rowKey)}
                                    className={`transition-colors duration-150 hover:bg-hover/80 ${rowClassName ? rowClassName(row) : ''}`}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td
                                            key={colIndex}
                                            className={`px-4 py-3 align-middle text-textMain ${col.cellClassName || ''}`}
                                        >
                                            {col.render ? col.render(row) : (col.accessor ? String(row[col.accessor]) : null)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(DataTable) as typeof DataTable;
