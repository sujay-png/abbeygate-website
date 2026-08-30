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
  const baseStyles =
    "inline-flex items-center justify-center px-6 py-3 text-sm font-medium whitespace-nowrap text-center transition-colors duration-200 ease-in-out cursor-pointer rounded-sm tracking-wide";

  const variants = {
    primary: "bg-brand-primary text-white hover:bg-brand-primary-dark",
    secondary: "bg-brand-tint text-brand-body hover:bg-brand-soft/60",
    outline: "border-2 border-brand-primary text-brand-primary hover:bg-brand-tint",
    white: "bg-white text-brand-body hover:bg-brand-tint border border-brand-border",
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
