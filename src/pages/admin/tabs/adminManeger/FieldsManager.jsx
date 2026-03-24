import React, { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';

export default function FieldsManager() {
    const [fields, setFields] = useState([]);
    const [groups, setGroups] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const initialForm = {
        field_code: '', 
        admin_label: '', 
        icon: '📍', 
        data_type: 'integer',
        ui_group: '', 
        source_type: 'osm', 
        parser_config: '{\n  "source": "osm",\n  "osm": {\n    "operator": "OR",\n    "filters": []\n  }\n}',
        ui_component: 'input_number', 
        is_visible_table: true, 
        is_visible_form: true, 
        sort_order: 0
    };
    
    const [formData, setFormData] = useState(initialForm);
    const [jsonError, setJsonError] = useState(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fieldsRes, groupsRes] = await Promise.all([
                supabase.from('fields_config').select('*').order('sort_order'),
                supabase.from('field_groups').select('*').order('sort_order')
            ]);
            if (fieldsRes.error) throw fieldsRes.error;
            if (groupsRes.error) throw groupsRes.error;
            
            setFields(fieldsRes.data || []);
            setGroups(groupsRes.data || []);
        } catch (error) {
            console.error("Помилка завантаження:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });

        if (name === 'parser_config') {
            try { JSON.parse(value); setJsonError(null); } 
            catch (err) { setJsonError("Невалідний JSON"); }
        }
    };

    const handleEdit = (item) => {
        const parsedConfig = typeof item.parser_config === 'object' ? JSON.stringify(item.parser_config, null, 2) : item.parser_config;
        setFormData({ ...item, parser_config: parsedConfig });
        setIsEditing(true);
        setJsonError(null);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData(initialForm);
        setIsEditing(false);
        setJsonError(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Ви впевнені, що хочете видалити це поле?')) return;
        try {
            const { error } = await supabase.from('fields_config').delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error("Помилка видалення:", error);
            alert(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (jsonError) return;
        setIsLoading(true);
        
        try {
            const payload = { ...formData };
            if (typeof payload.parser_config === 'string') {
                try { payload.parser_config = JSON.parse(payload.parser_config); } 
                catch (e) { payload.parser_config = {}; }
            }

            if (isEditing) {
                const { error } = await supabase.from('fields_config').update(payload).eq('id', formData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('fields_config').insert([payload]);
                if (error) throw error;
            }
            
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Помилка збереження:", error);
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Управління полями (Metrics)</h2>
                <button onClick={handleAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-bold shadow-sm">+ Додати поле</button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Код (БД)</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Назва (Admin)</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Група</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Джерело</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Дії</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {fields.map(field => {
                            const group = groups.find(g => g.id === field.ui_group);
                            return (
                                <tr key={field.id} className={!field.is_active ? "opacity-50 bg-gray-50" : "hover:bg-blue-50"}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{field.field_code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{field.icon} {field.admin_label}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group ? group.label_key : field.ui_group}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${field.source_type === 'osm' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {field.source_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(field)} className="text-indigo-600 hover:text-indigo-900 mr-4">Редагувати</button>
                                        <button onClick={() => handleDelete(field.id)} className="text-red-600 hover:text-red-900">Видалити</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50 sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Редагувати поле' : 'Нове поле'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Код поля в БД (напр. gyms_count)</label>
                                    <input required type="text" name="field_code" value={formData.field_code} onChange={handleInputChange} disabled={isEditing} className="mt-1 block w-full border border-gray-300 rounded p-2 bg-gray-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Назва в Адмінці (напр. Спортзали)</label>
                                    <input required type="text" name="admin_label" value={formData.admin_label} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Іконка (Emoji)</label>
                                    <input required type="text" name="icon" value={formData.icon} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Група UI</label>
                                    <select required name="ui_group" value={formData.ui_group} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2">
                                        <option value="">Оберіть групу...</option>
                                        {groups.map(g => <option key={g.id} value={g.id}>{g.label_key}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Тип даних</label>
                                    <select name="data_type" value={formData.data_type} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2">
                                        <option value="integer">Ціле число (integer)</option>
                                        <option value="numeric">Дрібне (numeric)</option>
                                        <option value="boolean">Так/Ні (boolean)</option>
                                        <option value="text">Текст (text)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700">Джерело даних</label>
                                    <select name="source_type" value={formData.source_type} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2">
                                        <option value="osm">OSM PBF (Парсер карти)</option>
                                        <option value="scraper">Скрапер (Сайти)</option>
                                        <option value="api">Зовнішнє API (GUS, WAQI)</option>
                                        <option value="manual">Ручне введення</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-6 mt-4 p-4 bg-gray-50 rounded border">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                    <span className="font-bold text-gray-700">Поле активне</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="is_visible_table" checked={formData.is_visible_table} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                    <span className="font-bold text-gray-700">Показувати в таблиці</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" name="is_visible_form" checked={formData.is_visible_form} onChange={handleInputChange} className="w-4 h-4 text-blue-600" />
                                    <span className="font-bold text-gray-700">Показувати у формі</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Конфігурація парсера (JSON) 
                                    {jsonError && <span className="text-red-500 ml-2 font-normal">{jsonError}</span>}
                                </label>
                                <textarea 
                                    name="parser_config" 
                                    value={formData.parser_config} 
                                    onChange={handleInputChange} 
                                    rows={8}
                                    className={`block w-full border ${jsonError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-900 text-green-400'} rounded p-3 font-mono text-sm`}
                                    spellCheck="false"
                                />
                                <p className="text-xs text-gray-500 mt-1">Використовується рушієм парсера для отримання даних з OSM, GUS або Scraper.</p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium">Скасувати</button>
                                <button type="submit" disabled={isLoading || jsonError} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 font-bold shadow-sm">
                                    {isLoading ? 'Збереження...' : 'Зберегти зміни'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}