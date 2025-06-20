import * as React from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange } from "react-day-picker";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface CalendarProps {
  className?: string;
  classNames?: Record<string, string>;
  showOutsideDays?: boolean;
  mode?: "single" | "multiple" | "range";
  selected?: Date | Date[] | DateRange | undefined;
  onSelect?: (date: Date | Date[] | DateRange | undefined) => void;
  disabled?: boolean | ((date: Date) => boolean);
}

/**
 * カスタムカレンダーコンポーネント
 * react-day-pickerをベースにTailwind CSSでスタイリング
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  mode = "single",
  selected,
  onSelect,
  disabled
}: CalendarProps) {
  const baseClassNames = {
    months: "flex flex-col",
    month: "space-y-4",
    caption: "flex justify-center pt-1 relative items-center",
    caption_label: "text-sm font-medium",
    nav: "space-x-1 flex items-center",
    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-y-1",
    head_row: "",
    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
    row: "flex w-full mt-2",
    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
    day_selected: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600",
    day_today: "bg-accent text-accent-foreground",
    day_outside: "text-muted-foreground opacity-50",
    day_disabled: "text-muted-foreground opacity-50",
    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
    day_hidden: "invisible",
    ...classNames,
  };

  // multipleモードの場合
  if (mode === "multiple") {
    return (
      <DayPicker
        mode="multiple"
        selected={selected as Date[]}
        onSelect={onSelect as (dates: Date[] | undefined) => void}
        disabled={disabled}
        showOutsideDays={showOutsideDays}
        locale={ja}
        weekStartsOn={0}
        className={cn("p-2", className)}
        classNames={baseClassNames}
      />
    );
  }

  // singleモードの場合（デフォルト）
  return (
    <DayPicker
      mode="single"
      selected={selected as Date}
      onSelect={onSelect as (date: Date | undefined) => void}
      disabled={disabled}
      showOutsideDays={showOutsideDays}
      locale={ja}
      weekStartsOn={0}
      className={cn("p-2", className)}
      classNames={baseClassNames}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar }; 