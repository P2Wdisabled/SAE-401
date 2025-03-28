// src/ui/FormTextarea.tsx
import React from "react";

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
}

const FormTextarea: React.FC<FormTextareaProps> = ({ label, value, onChange }) => (
  <div className="flex flex-col">
    <label className="mb-1 text-white">{label}</label>
    <textarea
      className="p-2 border border-gray-300 rounded"
      value={value}
      onChange={onChange}
    />
  </div>
);

export default FormTextarea;
