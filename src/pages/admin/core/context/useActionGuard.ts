import { useAdmin } from '@admin/core/context/AdminContext';

export const useActionGuard = () => {
    const { currentAdmin } = useAdmin();

    const isSuperAdmin = currentAdmin?.role === 'super_admin';

    const canDo = (action: string) => {
        if (!currentAdmin) return false;
        if (isSuperAdmin) return true;
        return currentAdmin.allowed_tabs?.includes(action) || false;
    };

    return { canDo, isSuperAdmin };
};
