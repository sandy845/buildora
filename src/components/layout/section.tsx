import type { ElementType, ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  id?: string;
};

export function Section({
  children,
  className = "",
  as: Component = "section",
  id,
}: SectionProps) {
  return (
    <Component id={id} className={`py-14 sm:py-16 ${className}`.trim()}>
      {children}
    </Component>
  );
}
