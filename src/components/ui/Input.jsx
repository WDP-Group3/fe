import { useState } from "react";

const Input = ({
  label,
  error,
  helperText,
  required = false,
  size = "md",
  leftIcon,
  rightIcon,
  className = "",
  disabled = false,
  type,
  showPasswordToggle = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  // Determine input type
  const inputType =
    showPasswordToggle && isPassword
      ? showPassword
        ? "text"
        : "password"
      : type;

  // Password toggle icon
  const passwordToggleIcon =
    showPasswordToggle && isPassword ? (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="text-slate-400 hover:text-slate-600 transition-colors"
        tabIndex={-1}
      >
        {showPassword ? (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        )}
      </button>
    ) : (
      rightIcon
    );
  const sizes = {
    sm: "px-3 py-1.5 text-xs h-8",
    md: "px-3 py-2 text-sm h-10",
    lg: "px-4 py-2.5 text-base h-12",
  };

  const baseInputStyles = `w-full rounded-xl border transition-all focus:outline-none focus:ring-2 ${
    sizes[size]
  } ${
    error
      ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100"
      : disabled
      ? "border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
      : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-100"
  } ${leftIcon ? "pl-10" : ""} ${
    passwordToggleIcon || rightIcon ? "pr-10" : ""
  } ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label
          className={`mb-1 block font-medium text-slate-700 ${
            size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm"
          }`}
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}
        <input
          disabled={disabled}
          className={baseInputStyles}
          type={inputType}
          {...props}
        />
        {passwordToggleIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {passwordToggleIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
