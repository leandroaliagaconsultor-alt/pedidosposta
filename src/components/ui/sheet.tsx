import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Utility function to merge classes. (Often kept in lib/utils.ts, putting here for mockup)
function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close

const SheetContent = React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <SheetPrimitive.Content
            ref={ref}
            className={cn(
                "fixed z-50 gap-4 bg-zinc-950 p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out inset-y-0 right-0 h-full w-3/4 border-l border-zinc-800 sm:max-w-md data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
                className
            )}
            {...props}
        >
            <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                <X className="h-4 w-4 text-zinc-400" />
                <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
            {children}
        </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-2 text-center sm:text-left",
            className
        )}
        {...props}
    />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
    React.ElementRef<typeof SheetPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
    <SheetPrimitive.Title
        ref={ref}
        className={cn("text-lg font-semibold text-zinc-50", className)}
        {...props}
    />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

export {
    Sheet,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
}
