interface CustomCheckboxProps {
    checked: boolean;
    onChange: () => void;
    label: string;
}

export const CustomCheckbox = ({ checked, onChange, label }: CustomCheckboxProps) => (
    <label className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all select-none ${
        checked
            ? 'bg-primary-subtle border-primary/30 text-primary font-semibold shadow-2xs'
            : 'bg-surface border-[#d6ccbf] dark:border-[#4a3f37] hover:bg-hover text-textMain'
    }`}>
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="accent-primary w-3.5 h-3.5 rounded cursor-pointer"
        />
        <span className="truncate">{label}</span>
    </label>
);
