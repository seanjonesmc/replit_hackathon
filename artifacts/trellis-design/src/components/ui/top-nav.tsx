import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";
export function TopNav({className,...props}:ComponentProps<"nav">) {
  return <nav aria-label="Primary" className={cn("ds-top-nav",className)} {...props}/>;
}
