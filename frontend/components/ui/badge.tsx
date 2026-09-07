import { cn } from "@/lib/utils";
export function Badge({children,className}:{children:React.ReactNode;className?:string}) { return <span className={cn("inline-flex items-center rounded-full border border-border bg-background/60 px-3 py-1 font-mono text-[11px] uppercase tracking-wider backdrop-blur",className)}>{children}</span> }

