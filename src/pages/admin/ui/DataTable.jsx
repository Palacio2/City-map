import React from 'react';
import styles from './DataTable.module.css';

const DataTable = ({ columns, data, emptyMessage, rowClassName }) => {
    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} className={col.className || ''}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className={styles.empty}>
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr key={row.id || rowIndex} className={rowClassName ? rowClassName(row) : ''}>
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex} className={col.cellClassName || ''}>
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