'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { cn } from '@/lib/utils';

interface CustomDatePickerProps {
  onChange: (date: Date | null) => void;
  selectedDate: Date | null;
  disabled?: boolean;
  className?: string;
}

const CustomDatePicker = ({ onChange, selectedDate, disabled, className }: CustomDatePickerProps) => {
  return (
    <DatePicker
      selected={selectedDate}
      onChange={onChange}
      dateFormat="MMMM d, yyyy"
      className={cn(
        "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      placeholderText="Select a date"
      disabled={disabled}
      showPopperArrow={false}
      popperClassName="date-picker-popper"
      popperPlacement="bottom-start"
      minDate={new Date()}
    />
  );
};

export default CustomDatePicker; 