import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP", { locale: es }) : <span>{placeholder}</span>}
            {value && (
              <span
                role="button"
                tabIndex={0}
                className="ml-auto rounded-sm opacity-60 transition-opacity hover:opacity-100 focus:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(undefined);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onChange?.(undefined);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
            locale={es}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DatePicker };