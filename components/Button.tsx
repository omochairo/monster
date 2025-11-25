import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const baseStyle = "font-bold rounded-full transition-all transform active:scale-95 shadow-lg border-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-white hover:from-pink-500 hover:to-rose-500 shadow-pink-200",
    secondary: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
    outline: "bg-transparent border-pink-400 text-pink-500 hover:bg-pink-50"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-8 py-3 text-lg",
    lg: "px-10 py-4 text-xl w-full"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
