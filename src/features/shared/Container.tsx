import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({
  children,
  className = "",
}: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-[1800px] px-6 lg:px-10 xl:px-16 ${className}`}
    >
      {children}
    </div>
  );
}
