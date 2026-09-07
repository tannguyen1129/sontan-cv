import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50", {variants:{variant:{default:"bg-foreground text-background hover:opacity-85",outline:"border border-border bg-background/40 hover:bg-foreground hover:text-background",ghost:"hover:bg-muted"},size:{default:"h-11 px-5",sm:"h-9 px-4",lg:"h-13 px-7 text-base",icon:"size-10"}},defaultVariants:{variant:"default",size:"default"}});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants>{asChild?:boolean}
export const Button=React.forwardRef<HTMLButtonElement,ButtonProps>(({className,variant,size,asChild=false,...props},ref)=>{const Comp=asChild?Slot:"button";return <Comp className={cn(buttonVariants({variant,size,className}))} ref={ref} {...props}/>}); Button.displayName="Button";

