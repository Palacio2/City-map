export interface PermissionAction {
    id: string;
    translationKey: string;
}

export interface PermissionConfig {
    id: string;
    translationKey: string;
    descriptionKey: string;
    actions?: PermissionAction[];
}

export interface PermissionGroup {
    titleKey: string;
    permissions: PermissionConfig[];
}

export const ADMIN_PERMISSIONS_CONFIG: PermissionGroup[] = [
    {
        titleKey: 'admin_panel.sections.analytics',
        permissions: [
            { 
                id: 'dashboard', 
                translationKey: 'admin_panel.tabs.dashboard', 
                descriptionKey: 'admin_roles.desc.dashboard'
            },
            { id: 'map', translationKey: 'admin_panel.tabs.map', descriptionKey: 'admin_roles.desc.map' }
        ]
    },
    {
        titleKey: 'admin_panel.sections.data_content',
        permissions: [
            { 
                id: 'parser', 
                translationKey: 'admin_panel.tabs.parser', 
                descriptionKey: 'admin_roles.desc.parser',
                actions: [
                    { id: 'parser.scan_osm', translationKey: 'admin_roles.actions.parser_scan_osm' },
                    { id: 'parser.create_districts', translationKey: 'admin_roles.actions.parser_create_districts' },
                    { id: 'parser.run_offline', translationKey: 'admin_roles.actions.parser_run_offline' },
                    { id: 'parser.import_geojson', translationKey: 'admin_roles.actions.parser_import_geojson' },
                    { id: 'parser.delete_districts', translationKey: 'admin_roles.actions.parser_delete_districts' }
                ]
            },
            { 
                id: 'manual', 
                translationKey: 'admin_panel.tabs.manual', 
                descriptionKey: 'admin_roles.desc.manual',
                actions: [
                    { id: 'manual.create.country', translationKey: 'admin_roles.actions.manual_create_country' },
                    { id: 'manual.create.city', translationKey: 'admin_roles.actions.manual_create_city' },
                    { id: 'manual.create.district', translationKey: 'admin_roles.actions.manual_create_district' },
                    { id: 'manual.edit', translationKey: 'admin_roles.actions.manual_edit' },
                    { id: 'manual.gis', translationKey: 'admin_roles.actions.manual_gis' },
                    { id: 'manual.save', translationKey: 'admin_roles.actions.manual_save' },
                    { id: 'manual.delete', translationKey: 'admin_roles.actions.manual_delete' }
                ]
            },
            { 
                id: 'scraper', 
                translationKey: 'admin_panel.tabs.scraper', 
                descriptionKey: 'admin_roles.desc.scraper',
                actions: [
                    { id: 'scraper.add_rule', translationKey: 'admin_roles.actions.scraper_add_rule' },
                    { id: 'scraper.edit_rule', translationKey: 'admin_roles.actions.scraper_edit_rule' },
                    { id: 'scraper.delete_rule', translationKey: 'admin_roles.actions.scraper_delete_rule' }
                ]
            }
        ]
    },
    {
        titleKey: 'admin_panel.sections.users',
        permissions: [
            { 
                id: 'users', 
                translationKey: 'admin_panel.tabs.users', 
                descriptionKey: 'admin_roles.desc.users',
                actions: [
                    { id: 'users.assign_cities', translationKey: 'admin_roles.actions.users_assign_cities' },
                    { id: 'users.gift_sub', translationKey: 'admin_roles.actions.users_gift_sub' },
                    { id: 'users.promo_codes', translationKey: 'admin_roles.actions.users_promo_codes' },
                    { id: 'users.terminate', translationKey: 'admin_roles.actions.users_terminate' },
                    { id: 'users.delete', translationKey: 'admin_roles.actions.users_delete' }
                ]
            },
            { 
                id: 'comments', 
                translationKey: 'admin_panel.tabs.comments', 
                descriptionKey: 'admin_roles.desc.comments',
                actions: [
                    { id: 'comments.hide', translationKey: 'admin_roles.actions.comments_hide' },
                    { id: 'comments.delete', translationKey: 'admin_roles.actions.comments_delete' }
                ]
            },
            { 
                id: 'feedback', 
                translationKey: 'admin_panel.tabs.feedback', 
                descriptionKey: 'admin_roles.desc.feedback',
                actions: [
                    { id: 'feedback.change_status', translationKey: 'admin_roles.actions.feedback_change_status' },
                    { id: 'feedback.delete', translationKey: 'admin_roles.actions.feedback_delete' }
                ]
            }
        ]
    },
    {
        titleKey: 'admin_panel.sections.system',
        permissions: [
            { 
                id: 'ai', 
                translationKey: 'admin_panel.tabs.ai', 
                descriptionKey: 'admin_roles.desc.ai',
                actions: [
                    { id: 'ai.toggle', translationKey: 'admin_roles.actions.ai_toggle' }
                ]
            },
            { 
                id: 'fields', 
                translationKey: 'admin_panel.tabs.fields', 
                descriptionKey: 'admin_roles.desc.fields',
                actions: [
                    { id: 'fields.add', translationKey: 'admin_roles.actions.fields_add' },
                    { id: 'fields.edit', translationKey: 'admin_roles.actions.fields_edit' },
                    { id: 'fields.delete', translationKey: 'admin_roles.actions.fields_delete' }
                ]
            },
            { 
                id: 'translations', 
                translationKey: 'admin_panel.tabs.translations', 
                descriptionKey: 'admin_roles.desc.translations',
                actions: [
                    { id: 'translations.add', translationKey: 'admin_roles.actions.translations_add' },
                    { id: 'translations.edit', translationKey: 'admin_roles.actions.translations_edit' },
                    { id: 'translations.delete', translationKey: 'admin_roles.actions.translations_delete' },
                    { id: 'translations.audit', translationKey: 'admin_roles.actions.translations_audit' }
                ]
            },
            { 
                id: 'notifications', 
                translationKey: 'admin_panel.tabs.notifications', 
                descriptionKey: 'admin_roles.desc.notifications',
                actions: [
                    { id: 'notifications.send', translationKey: 'admin_roles.actions.notifications_send' }
                ]
            },
            { id: 'audit', translationKey: 'admin_panel.tabs.audit', descriptionKey: 'admin_roles.desc.audit' }
        ]
    }
];
