import { ReactNode } from "react";

const gradientStyle = {
  fontFamily: "var(--font-bebas)",
  background: "linear-gradient(120deg, #f5f5f0 30%, #c9a84c 65%, #e8c76a 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  backgroundClip: "text" as const,
};

interface TitleProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}

export default function Title({ children, className = "", as: Tag = "h2" }: TitleProps) {
  return (
    <Tag
      style={gradientStyle}
      className={`uppercase leading-none tracking-wide ${className}`}
    >
      {children}
    </Tag>
  );
}
