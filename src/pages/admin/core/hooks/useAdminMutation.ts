import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useModals } from '@admin/core/context/ModalContext';

export function useAdminMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
    options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
    const { showAlert } = useModals();

    return useMutation<TData, TError, TVariables, TContext>({
        ...options,
        onError: (...args) => {
            const [error] = args;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            showAlert('Error', errorMessage, 'error');
            if (options?.onError) {
                options.onError(...args);
            }
        },
    });
}


