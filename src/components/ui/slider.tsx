"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "./utils";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  style,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      style={style}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
        )}
        style={{
          backgroundColor: (style as any)?.['--slider-track-bg'] || '#e5e7eb',
        } as React.CSSProperties}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
          )}
          style={{
            backgroundColor: (style as any)?.['--slider-range-bg'] || '#3b82f6',
          } as React.CSSProperties}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block shrink-0 rounded-full border-2 border-white shadow-lg transition-all hover:scale-110 focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 bg-blue-600"
          style={{
            width: (style as any)?.['--slider-thumb-size'] || '20px',
            height: (style as any)?.['--slider-thumb-size'] || '20px',
          } as React.CSSProperties}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
