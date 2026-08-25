import { useAdmin } from '@admin/core/context/AdminContext';
import { supabase } from '@supabaseClient';

export function useActionLogger() {
    const { currentAdmin } = useAdmin();

    const withLogging = async <T,>(actionName: string, actionFn: () => Promise<T>, details?: Record<string, unknown> | string): Promise<T> => {
        try {
            const result = await actionFn();
            
            // Log success
            if (currentAdmin?.id) {
                const newDataObj = {
                    status: 'success',
                    ...(details ? (typeof details === 'string' ? { message: details } : details) : {})
                };
                try {
                    await supabase.from('audit_logs').insert({
                        admin_id: currentAdmin.id,
                        action: actionName,
                        new_data: newDataObj
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
                    await supabase.from('audit_logs').insert({
                        admin_id: currentAdmin.id,
                        action: actionName,
                        new_data: newDataObj
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
