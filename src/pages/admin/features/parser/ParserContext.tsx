/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, ReactNode } from 'react';
import { useParserTab } from './useParserTab';

type ParserContextType = ReturnType<typeof useParserTab>;

const ParserContext = createContext<ParserContextType | null>(null);

export const useParserContext = () => {
    const context = useContext(ParserContext);
    if (!context) {
        throw new Error('useParserContext must be used within a ParserProvider');
    }
    return context;
};

export const ParserProvider = ({ children }: { children: ReactNode }) => {
    const tabLogic = useParserTab();

    return (
        <ParserContext.Provider value={tabLogic}>
            {children}
        </ParserContext.Provider>
    );
};

