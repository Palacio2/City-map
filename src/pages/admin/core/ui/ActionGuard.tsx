import React, { ReactNode } from 'react';
import { useActionGuard } from '@admin/core/context/useActionGuard';

interface ActionGuardProps {
    action: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export const ActionGuard: React.FC<ActionGuardProps> = ({ action, children, fallback = null }) => {
    const { canDo } = useActionGuard();
    if (canDo(action)) {
        return <>{children}</>;
    }
    return <>{fallback}</>;
};