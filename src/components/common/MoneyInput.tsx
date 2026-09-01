"use client";

import type { ChangeEvent, InputHTMLAttributes } from "react";
import { normalizeMoneyInput } from "@/lib/utils/format";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue"> & {
  value?: string;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
};

export function MoneyInput({ value, defaultValue, onChange, ...props }: Props) {
  const sharedProps = {
    ...props,
    inputMode: "numeric" as const,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      onChange?.(normalizeMoneyInput(event.target.value));
    },
  };

  if (value !== undefined) {
    return <input {...sharedProps} value={value} />;
  }

  return <input {...sharedProps} defaultValue={normalizeMoneyInput(defaultValue)} />;
}
