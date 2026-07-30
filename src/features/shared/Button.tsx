import { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "white";
  className?: string;
  href?: string;
}

export const Button = ({
  children,
  variant = "primary",
  className = "",
  href,
  ...props
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-colors duration-200 ease-in-out cursor-pointer rounded-sm";
  
  const variants = {
    primary: "bg-black text-white hover:bg-neutral-800",
    secondary: "bg-gray-100 text-black hover:bg-gray-200",
    outline: "border-2 border-black text-black",
    white: "bg-white text-black hover:bg-gray-100",
  };

  if (href) {
    return (
      <Link href={href} className={`${baseStyles} ${variants[variant]} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
