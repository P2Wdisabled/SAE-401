// src/ui/CheckboxField.tsx
import React from "react";

interface CheckboxFieldProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({ label, description, checked, onChange }) => {
  return (
    <div className="mb-4">
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mr-2"
        />
        {label}
      </label>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
};

export default CheckboxField;
