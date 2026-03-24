import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../services/api';

export const useDynamicFields = () => {
    const { t } = useTranslation();

    const { data: groupsData = [], isLoading: isGroupsLoading } = useQuery({
        queryKey: ['fieldGroups'],
        queryFn: api.config.getGroups,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false
    });

    const { data: fieldsData = [], isLoading: isFieldsLoading } = useQuery({
        queryKey: ['fieldsConfig'],
        queryFn: api.config.getFields,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false
    });

    const isLoading = isGroupsLoading || isFieldsLoading;

    const { metricGroups, fieldsConfig } = useMemo(() => {
        if (!groupsData.length || !fieldsData.length) {
            return { metricGroups: [], fieldsConfig: [] };
        }

        const activeFields = fieldsData
            .filter(field => field.is_active)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        const formattedFields = activeFields.map(field => ({
            id: field.id,
            key: field.field_code,
            label: t(field.field_code, field.admin_label),
            type: field.data_type || 'text',
            ui_component: field.ui_component || 'input_text',
            icon: field.icon,
            source_type: field.source_type,
            is_osm: field.source_type === 'osm_pbf' || !!field.osm_key,
            osm_key: field.osm_key,
            osm_value: field.osm_value,
            parser_config: field.parser_config || {},
            is_visible_form: field.is_visible_form,
            is_visible_table: field.is_visible_table,
            ui_group: field.ui_group
        }));

        const sortedGroups = [...groupsData].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        
        const grouped = sortedGroups.map(group => ({
            id: group.id,
            title: t(group.label_key, group.label_key), 
            icon: group.icon,
            bgColor: group.bg_color,
            fields: formattedFields.filter(f => f.ui_group === group.id)
        })).filter(group => group.fields.length > 0);

        return { metricGroups: grouped, fieldsConfig: formattedFields };
    }, [groupsData, fieldsData, t]);

    return { metricGroups, fieldsConfig, isLoading };
};