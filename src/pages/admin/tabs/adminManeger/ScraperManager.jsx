import React, { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';

export default function ScraperManager() {
    const [rules, setRules] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const initialForm = {
        country_code: 'PL',
        platform: 'otodom',
        type: 'sale',
        item_selector: 'article',
        price_regex: '',
        sqm_regex: '',
        min_price: 0,
        max_price: 999999999,
        min_sqm: 0,
        max_sqm: 99999,
        is_active: true
    };
    const [formData, setFormData] = useState(initialForm);

    useEffect(() => { fetchRules(); }, []);

    const fetchRules = async () => {
        try {
            const { data, error } = await supabase.from('scraper_rules').select('*').order('created_at');
            if (error) throw error;
            if (Array.isArray(data)) setRules(data);
        } catch (error) {
            console.error("Помилка завантаження правил:", error);
            setRules([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const parsedValue = (type === 'number') ? Number(value) : value;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : parsedValue });
    };

    const handleEdit = (item) => {
        setFormData(item);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData(initialForm);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Видалити правило?')) return;
        try {
            const { error } = await supabase.from('scraper_rules').delete().eq('id', id);
            if (error) throw error;
            fetchRules();
        } catch (error) {
            console.error("Помилка видалення:", error);
            alert(error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isEditing) {
                const { error } = await supabase.from('scraper_rules').update(formData).eq('id', formData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('scraper_rules').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchRules();
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
                <h2 className="text-xl font-bold text-gray-800">Правила Скрапера</h2>
                <button onClick={handleAddNew} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-bold shadow-sm">+ Додати правило</button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Країна / Платформа</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Тип</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ліміти Цін</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Статус</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Дії</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {rules.map(rule => (
                            <tr key={rule.id} className={!rule.is_active ? "opacity-50 bg-gray-50" : "hover:bg-purple-50"}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{rule.country_code} - {rule.platform}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.type === 'sale' ? 'Продаж' : 'Оренда'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rule.min_price} - {rule.max_price}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {rule.is_active ? <span className="text-green-600 font-bold">Активно</span> : <span className="text-gray-400">Вимкнено</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(rule)} className="text-indigo-600 hover:text-indigo-900 mr-4">Редагувати</button>
                                    <button onClick={() => handleDelete(rule.id)} className="text-red-600 hover:text-red-900">Видалити</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Редагувати правило' : 'Нове правило'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Код країни</label>
                                    <input required type="text" name="country_code" value={formData.country_code} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Платформа</label>
                                    <input required type="text" name="platform" value={formData.platform} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Тип (sale/rent)</label>
                                    <select required name="type" value={formData.type} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2">
                                        <option value="sale">Sale (Продаж)</option>
                                        <option value="rent">Rent (Оренда)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">HTML Селектор картки</label>
                                    <input required type="text" name="item_selector" value={formData.item_selector} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">RegEx для Ціни</label>
                                    <input required type="text" name="price_regex" value={formData.price_regex} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2 font-mono text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">RegEx для Площі</label>
                                    <input required type="text" name="sqm_regex" value={formData.sqm_regex} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2 font-mono text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mb-4 bg-gray-50 p-4 rounded border">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700">Мін. Ціна</label>
                                    <input required type="number" name="min_price" value={formData.min_price} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700">Макс. Ціна</label>
                                    <input required type="number" name="max_price" value={formData.max_price} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700">Мін. Площа</label>
                                    <input required type="number" name="min_sqm" value={formData.min_sqm} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700">Макс. Площа</label>
                                    <input required type="number" name="max_sqm" value={formData.max_sqm} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                                </div>
                            </div>

                            <div className="flex items-center mt-4">
                                <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 font-bold">Правило активне (використовується парсером)</label>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium">Скасувати</button>
                                <button type="submit" disabled={isLoading} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:bg-purple-300 font-bold shadow-sm">
                                    {isLoading ? 'Збереження...' : 'Зберегти'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}