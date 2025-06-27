import * as React from "react"

// Basic className utility
function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-transparent bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600", 
    destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
    outline: "text-gray-950 dark:text-gray-50 border-gray-200 dark:border-gray-600",
    success: "border-transparent bg-green-500 text-white hover:bg-green-600",
    warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge } 