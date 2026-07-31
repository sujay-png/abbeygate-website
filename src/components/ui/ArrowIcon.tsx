import Image from "next/image";

interface ArrowIconProps {
  className?: string;
}

export function ArrowIcon({ className = "" }: ArrowIconProps) {
  return (
    <Image
      src="/images/icons/cartoonarrow.png"
      alt="Decorative Arrow"
      width={90}
      height={90}
      className={className}
      style={{ filter: "drop-shadow(0.3px 0.3px 0px black)" }}
    />
  );
}
