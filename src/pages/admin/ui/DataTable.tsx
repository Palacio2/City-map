import React from 'react';

const DataTable = ({ columns, data, emptyMessage, rowClassName }: any) => {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface shadow-subtle">
            <table className="w-full border-collapse text-xs text-left">
                <thead>
                    <tr className="bg-main/60 border-b border-border">
                        {columns.map((col: any, index: number) => (
                            <th
                                key={index}
                                className={`px-4 py-3 text-textMuted font-medium uppercase tracking-wider text-[11px] whitespace-nowrap ${col.className || ''}`}
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
                        data.map((row: any, rowIndex: number) => {
                            const rowKey = row.id || row.district_id || row.translation_key || rowIndex;
                            return (
                                <tr
                                    key={rowKey}
                                    className={`transition-colors duration-100 hover:bg-hover ${rowClassName ? rowClassName(row) : ''}`}
                                >
                                    {columns.map((col: any, colIndex: number) => (
                                        <td
                                            key={colIndex}
                                            className={`px-4 py-3 align-middle text-textMain ${col.cellClassName || ''}`}
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