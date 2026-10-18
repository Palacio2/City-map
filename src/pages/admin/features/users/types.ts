export interface UserRow {
    id: string;
    email: string;
    plan: string;
    role: string;
    cities?: string[];
    allowed_tabs?: string[];
    created_at: string;
    [key: string]: unknown;
}

export interface CityData {
    id: string;
    name: string;
    countryName?: string;
    [key: string]: unknown;
}

export interface AdminUsersAPI {
    manageFinance: (action: string, payload?: Record<string, unknown>) => Promise<{ codes?: { id: string; code: string; [key: string]: unknown }[] } | Record<string, unknown>>;
}
