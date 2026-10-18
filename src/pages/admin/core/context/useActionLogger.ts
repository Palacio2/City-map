import { useAdmin } from '@admin/core/context/AdminContext';
import { invokeAdminApi } from '@admin/core/api/adminApiClient';

export function useActionLogger() {
    const { currentAdmin } = useAdmin();

    const withLogging = async <T,>(actionName: string, actionFn: () => Promise<T>, details?: Record<string, unknown> | string): Promise<T> => {
        try {
            const result = await actionFn();
            if (result && typeof result === 'object' && 'error' in result && result.error) throw result.error;
            
            // Log success
            if (currentAdmin?.id) {
                const newDataObj = {
                    status: 'success',
                    ...(details ? (typeof details === 'string' ? { message: details } : details) : {})
                };
                try {
                    await invokeAdminApi('admin-logs-manage', {
                        action: 'insert_client_event',
                        log: { action: actionName, details: newDataObj }
                    });
                } catch (logError) {
                    console.error('Failed to write audit log for success:', logError);
                }
            }
            
            return result;
        } catch (error) {
            // Log error
            if (currentAdmin?.id) {
                const newDataObj = {
                    status: 'error',
                    error: String(error),
                    ...(typeof details === 'object' ? details : { message: details })
                };
                try {
                    await invokeAdminApi('admin-logs-manage', {
                        action: 'insert_client_event',
                        log: { action: actionName, details: newDataObj }
                    });
                } catch (logError) {
                    console.error('Failed to write audit log for error:', logError);
                }
            }
            throw error;
        }
    };

    return { withLogging };
}
