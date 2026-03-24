import React from 'react';

const DataTable = ({ columns, data, emptyMessage, rowClassName }) => {
    return (
        <div className="overflow-x-auto rounded-md border border-border bg-surface shadow-sm max-h-[70vh] scrollbar-thin">
            <table className="w-full border-collapse text-[0.95rem] text-left relative">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th 
                                key={index} 
                                className={`p-4 sm:px-5 bg-surface text-textMuted font-bold whitespace-nowrap uppercase text-[0.8rem] tracking-wider sticky top-0 z-10 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:border-b-2 after:border-border ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-16 px-5 text-textMuted italic text-base bg-surface">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr 
                                key={row.id || rowIndex} 
                                className={`transition-colors duration-200 hover:bg-main last:border-b-0 ${rowClassName ? rowClassName(row) : ''}`}
                            >
                                {columns.map((col, colIndex) => (
                                    <td 
                                        key={colIndex} 
                                        className={`p-4 sm:px-5 border-b border-border align-middle text-textMain ${col.cellClassName || ''}`}
                                    >
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(DataTable);