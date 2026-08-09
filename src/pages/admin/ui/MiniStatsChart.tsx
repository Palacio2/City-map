// @ts-nocheck
import React, { useMemo } from 'react';

const MiniStatsChart = ({ data, title }) => {
    const maxValue = useMemo(() => {
        return Math.max(...data.map(item => item.value), 1);
    }, [data]);

    return (
        <div className="bg-surface p-6 rounded-lg border border-border shadow-sm flex-1 min-w-[300px] transition-all duration-300 hover:shadow-md hover:-translate-y-[2px]">
            <h4 className="m-0 mb-6 text-[0.95rem] text-textMuted uppercase tracking-wider font-bold">
                {title}
            </h4>
            <div className="flex items-end justify-between h-[160px] gap-3 pt-6">
                {data.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2.5 h-full group">
                        <div className="flex-1 w-full flex items-end justify-center">
                            <div 
                                className="w-[65%] bg-primary rounded-t-sm relative transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] min-h-[4px] shadow-[0_4px_10px_rgba(59,130,246,0.2)] group-hover:bg-primary-hover group-hover:brightness-105" 
                                style={{ height: `${(item.value / maxValue) * 100}%` }}
                            >
                                <span className="absolute -top-[30px] left-1/2 -translate-x-1/2 translate-y-[5px] bg-textMain text-surface py-1 px-2 rounded-sm text-[0.75rem] font-bold opacity-0 invisible transition-all duration-200 shadow-md whitespace-nowrap z-10 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 before:content-[''] before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-textMain">
                                    {item.value}
                                </span>
                            </div>
                        </div>
                        <span className="text-[0.8rem] font-semibold text-textMuted whitespace-nowrap">
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default React.memo(MiniStatsChart);
