"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  Command,
  CommandGroup,
  CommandInput,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  disabled = false,
  className
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredOptions = searchQuery === "" 
    ? options 
    : options.filter((option) => 
        option.toLowerCase().includes(searchQuery.toLowerCase())
      )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selected.length > 0
              ? `${selected.length} selected`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandGroup className="max-h-64 overflow-auto">
            {filteredOptions.map((option) => (
              <div
                key={option}
                className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-accent"
                onClick={() => {
                  const newSelected = selected.includes(option)
                    ? selected.filter(item => item !== option)
                    : [...selected, option]
                  onChange(newSelected)
                }}
              >
                <div className="flex h-4 w-4 items-center justify-center rounded border">
                  {selected.includes(option) && (
                    <div className="h-3 w-3 bg-green-500 rounded-sm" />
                  )}
                </div>
                <span>{option}</span>
              </div>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 