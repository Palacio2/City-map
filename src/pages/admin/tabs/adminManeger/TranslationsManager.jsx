import React, { useState, useEffect } from 'react';
import { supabase } from '@supabaseClient';

export default function TranslationsManager() {
    const [translations, setTranslations] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const initialForm = { translation_key: '', uk: '', pl: '', en: '' };
    const [formData, setFormData] = useState(initialForm);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => { fetchTranslations(); }, []);

    const fetchTranslations = async () => {
        try {
            const { data, error } = await supabase.from('translations').select('*').order('translation_key');
            if (error) throw error;
            if (Array.isArray(data)) setTranslations(data);
        } catch (error) {
            console.error("Помилка:", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
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

    const handleDelete = async (key) => {
        if (!window.confirm('Видалити цей переклад?')) return;
        try {
            const { error } = await supabase.from('translations').delete().eq('translation_key', key);
            if (error) throw error;
            fetchTranslations();
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
                const { error } = await supabase.from('translations').update(formData).eq('translation_key', formData.translation_key);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('translations').insert([formData]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            fetchTranslations();
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
                <h2 className="text-xl font-bold text-gray-800">Локалізація (Переклади)</h2>
                <button onClick={handleAddNew} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-bold shadow-sm">+ Додати ключ</button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ключ</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">🇺🇦 Українська</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">🇵🇱 Польська</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">🇬🇧 Англійська</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Дії</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {translations.map(item => (
                            <tr key={item.translation_key} className="hover:bg-green-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-700">{item.translation_key}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">{item.uk}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">{item.pl}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">{item.en}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">Редагувати</button>
                                    <button onClick={() => handleDelete(item.translation_key)} className="text-red-600 hover:text-red-900">Видалити</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-gray-200">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                            <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Редагувати переклад' : 'Додати переклад'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700">Ключ (напр. header.title)</label>
                                <input required type="text" name="translation_key" value={formData.translation_key} onChange={handleInputChange} disabled={isEditing} className="mt-1 block w-full border border-gray-300 rounded p-2 bg-gray-50 font-mono" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">🇺🇦 Українська</label>
                                <input required type="text" name="uk" value={formData.uk} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">🇵🇱 Польська</label>
                                <input required type="text" name="pl" value={formData.pl} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700">🇬🇧 Англійська</label>
                                <input required type="text" name="en" value={formData.en} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded p-2" />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium">Скасувати</button>
                                <button type="submit" disabled={isLoading} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-green-300 font-bold shadow-sm">
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