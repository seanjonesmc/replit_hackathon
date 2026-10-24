import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";
export function Footer({className,...props}:ComponentProps<"footer">){
 return <footer className={cn("ds-footer",className)} {...props}/>;
}
