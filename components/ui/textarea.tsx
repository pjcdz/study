import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[100px] w-full rounded-lg border-2 border-dashed border-muted-foreground/20 bg-card p-8 text-card-foreground transition-colors focus:border-primary focus:bg-primary/5 shadow-sm outline-none",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
