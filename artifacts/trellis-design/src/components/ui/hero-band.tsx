import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";
export function HeroBand({className,tone="light",...props}:ComponentProps<"section">&{tone?:"light"|"sand"}) {
  return <section className={cn("ds-hero",`ds-hero-${tone}`,className)} {...props}/>;
}
