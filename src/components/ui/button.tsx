import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#9a5b43] text-white shadow-[0_12px_30px_rgba(117,70,52,0.22)] hover:bg-[#7f4937] hover:shadow-card",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-[#b98a74]/45 bg-white text-[#3b2922] shadow-soft hover:border-[#9a5b43] hover:bg-[#fff7f0]",
        secondary: "bg-[#f0e5db] text-[#3b2922] hover:bg-[#e7d7ca]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-to-r from-[#8f4f3b] via-[#a96147] to-[#7b4334] text-white shadow-[0_18px_42px_rgba(117,70,52,0.28)] hover:shadow-card hover:scale-[1.02]",
        "hero-outline": "border-2 border-[#9a5b43]/45 bg-white text-[#3b2922] shadow-soft hover:border-[#7f4937] hover:bg-[#fff7f0] backdrop-blur-sm",
        cta: "bg-[#263c32] text-white hover:bg-[#1d2f27] shadow-card hover:shadow-elevated",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-14 rounded-xl px-8 text-base",
        xl: "h-16 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
