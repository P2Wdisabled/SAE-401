import React from "react";
import { cva, VariantProps } from "class-variance-authority";

type InputProps = {
  label: string;
  type: string;
} & React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof containerClasses>;

const containerClasses = cva("relative", {
  variants: {
    size: {
      default: "w-72",
      full: "w-full",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const inputClasses = cva(
  "peer block w-full border border-gray-500 rounded-[3px] bg-transparent px-3 py-3 text-white placeholder-transparent focus:outline-none focus:border-blue-500 transition"
);

const labelClasses = cva(
  "pointer-events-none absolute left-3 -top-3 bg-[#17202A] px-1 text-gray-400 transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-focus:text-blue-500 peer-focus:-top-3 peer-focus:-translate-y-0"
);

function FormInput({ label, type, size, ...rest }: InputProps) {
  return (
    <div className={containerClasses({ size })}>
      <input
        type={type}
        placeholder=" "
        className={inputClasses()}
        {...rest}
      />
      <label className={labelClasses()}>{label}</label>
    </div>
  );
}

export default FormInput;
