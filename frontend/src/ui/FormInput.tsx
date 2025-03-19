import React from "react";

type InputProps = {
  label: string;
  type: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

function FormInput({ label, type, ...rest }: InputProps) {
  return (
    <div className="relative w-72">
      <input
        type={type}
        placeholder=" " /* Espace obligatoire pour déclencher :placeholder-shown */
        className="peer block w-full border border-gray-500 rounded-[3px] bg-transparent px-3 py-3 text-white placeholder-transparent focus:outline-none focus:border-blue-500 transition"
        {...rest}
      />
      <label
        className="pointer-events-none absolute left-3 -top-3 bg-[#17202A] px-1 text-gray-400 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-focus:text-blue-500 peer-focus:-top-3 peer-focus:-translate-y-0"
      >
        {label}
      </label>
    </div>
  );
}

export default FormInput;
