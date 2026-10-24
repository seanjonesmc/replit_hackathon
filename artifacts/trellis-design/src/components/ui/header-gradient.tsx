import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";
export function HeaderGradient({className,...props}:ComponentProps<"div">) {
  return <div className={cn("ds-header-gradient",className)} {...props}/>;
}
