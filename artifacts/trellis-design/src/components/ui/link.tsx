import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";
export function Link({className,variant="nav",...props}:ComponentProps<"a">&{variant?:"nav"|"inline"|"row"|"footer"}) {
  return <a className={cn("ds-link",`ds-link-${variant}`,className)} {...props}/>;
}
