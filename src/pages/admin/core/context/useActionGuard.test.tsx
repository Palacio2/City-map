import { renderHook } from '@testing-library/react';
import { useActionGuard } from './useActionGuard';
import { useAdmin } from '@admin/core/context/AdminContext';
import { describe, it, expect, vi } from 'vitest';

// Mock the useAdmin hook
vi.mock('@admin/core/context/AdminContext', () => ({
    useAdmin: vi.fn(),
}));

describe('useActionGuard', () => {
    it('returns false for canDo and isSuperAdmin if no admin is logged in', () => {
        vi.mocked(useAdmin).mockReturnValue({ currentAdmin: null } as any);
        const { result } = renderHook(() => useActionGuard());
        
        expect(result.current.isSuperAdmin).toBe(false);
        expect(result.current.canDo('any.action')).toBe(false);
    });

    it('returns true for all canDo checks and isSuperAdmin if user is super_admin', () => {
        vi.mocked(useAdmin).mockReturnValue({ 
            currentAdmin: { role: 'super_admin', allowed_tabs: [] } 
        } as any);
        const { result } = renderHook(() => useActionGuard());
        
        expect(result.current.isSuperAdmin).toBe(true);
        expect(result.current.canDo('random.action')).toBe(true);
    });

    it('returns true for canDo if action is in allowed_tabs for normal admin', () => {
        vi.mocked(useAdmin).mockReturnValue({ 
            currentAdmin: { role: 'admin', allowed_tabs: ['specific.action'] } 
        } as any);
        const { result } = renderHook(() => useActionGuard());
        
        expect(result.current.isSuperAdmin).toBe(false);
        expect(result.current.canDo('specific.action')).toBe(true);
    });

    it('returns false for canDo if action is not in allowed_tabs for normal admin', () => {
        vi.mocked(useAdmin).mockReturnValue({ 
            currentAdmin: { role: 'admin', allowed_tabs: ['other.action'] } 
        } as any);
        const { result } = renderHook(() => useActionGuard());
        
        expect(result.current.isSuperAdmin).toBe(false);
        expect(result.current.canDo('specific.action')).toBe(false);
    });
});
