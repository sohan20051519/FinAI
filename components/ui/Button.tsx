
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <button
      {...props}
      className={`px-6 py-2.5 bg-primary text-on-primary rounded-full font-medium text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-opacity-75 transition-shadow disabled:bg-on-surface/12 disabled:text-on-surface/38 disabled:cursor-not-allowed ${props.className}`}
    >
      {children}
    </button>
  );
};

export default Button;
