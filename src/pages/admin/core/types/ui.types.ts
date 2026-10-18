export interface FormattedFieldItem {
    id: string;
    key: string;
    label: string;
    type: string;
    ui_component: string;
    icon?: string;
    source_type?: string;
    is_osm?: boolean;
    osm_key?: string;
    osm_value?: string;
    parser_config?: Record<string, unknown>;
    is_visible_form?: boolean;
    is_visible_table?: boolean;
    ui_group?: string;
    sort_order?: number;
}

export interface ModalContextType {
    showConfirm: (title: string, message: string, onConfirm: () => void | Promise<void>, options?: Record<string, unknown>) => void;
    showAlert: (title: string, message: string, type?: 'info' | 'error' | 'success' | 'warning') => void;
}

export interface DynamicFormRendererProps {
    fieldsConfig: FormattedFieldItem[];
    formData: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    readOnly?: boolean;
}

export interface NotificationItem {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | string;
    is_active: boolean;
    created_at: string;
}

export interface AiLogItem {
    id: string;
    created_at?: string | null;
    log_type?: 'system' | 'chat' | string | null;
    user_id?: string | null;
    user_email?: string | null;
    system_action?: string | null;
    prompt?: string | null;
    response?: string | null;
}

export interface AuditLogItem {
    id: string;
    created_at: string;
    admin_id?: string;
    action: string;
    target_table?: string;
    new_data?: Record<string, unknown> | null;
    old_data?: Record<string, unknown> | null;
}