import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidthClass?: string;
}

export function Container({
  children,
  className = "",
  maxWidthClass = "max-w-[1800px]",
}: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full ${maxWidthClass} px-6 lg:px-10 xl:px-16 ${className}`}
    >
      {children}
    </div>
  );
}
