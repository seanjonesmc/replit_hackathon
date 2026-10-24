import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";
export interface DownloadPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {asChild?:boolean}
export const DownloadPill=React.forwardRef<HTMLButtonElement,DownloadPillProps>(
 ({className,asChild=false,...props},ref)=>{
  const Comp=asChild?Slot:"button";
  return <Comp ref={ref} className={cn("ds-download-pill",className)} {...props}/>;
 });
DownloadPill.displayName="DownloadPill";
