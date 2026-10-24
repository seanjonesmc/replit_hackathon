import type { HTMLAttributes } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
export const badgeVariants = cva("ds-badge");
export function Badge({className,...props}:HTMLAttributes<HTMLDivElement>){
 return <div className={cn(badgeVariants(),className)} {...props}/>;
}
