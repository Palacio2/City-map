import React from 'react';

// From hooks/AdminContext.tsx
export interface AdminUser {
    id: string;
    email: string;
    role: string;
    cities: string[];
    allowed_tabs: string[];
}

export interface AdminContextType {
    currentAdmin: AdminUser | null | undefined;
    loadingAdmin: boolean;
    adminLogout: () => void | Promise<void>;
    adminLogin: () => void;
}

// From AdminSidebar.tsx
export interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

export interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogout?: () => void;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
}
