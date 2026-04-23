import React from 'react';

const DataTable = ({ columns, data, emptyMessage, rowClassName }) => {
    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm max-h-[70vh] scrollbar-thin">
            <table className="w-full border-collapse text-[0.95rem] text-left relative">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th 
                                key={index} 
                                className={`p-4 sm:px-5 bg-main/80 backdrop-blur-md text-textMuted font-extrabold whitespace-nowrap uppercase text-[0.75rem] tracking-wider sticky top-0 z-10 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:border-b-2 after:border-border ${col.className || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-16 px-5 text-textMuted italic font-medium text-[0.95rem] bg-surface">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row) => {
                            const rowKey = row.id || row.district_id || row.translation_key || crypto.randomUUID();
                            return (
                                <tr 
                                    key={rowKey} 
                                    className={`transition-all duration-200 hover:bg-main/50 last:border-b-0 group ${rowClassName ? rowClassName(row) : ''}`}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td 
                                            key={colIndex} 
                                            className={`p-4 sm:px-5 border-b border-border align-middle text-textMain group-hover:border-transparent ${col.cellClassName || ''}`}
                                        >
                                            {col.render ? col.render(row) : row[col.accessor]}
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

export default React.memo(DataTable);