/**
 * SafeNumberFlow — #418-free NumberFlow.
 *
 * `@number-flow/react` is a custom element whose SSR markup is a
 * `<number-flow-react>` tag with a declarative `<template shadowroot>`,
 * which React 19's hydration cannot adopt — that mismatch is console
 * error `#418` ("Hydration failed because the initial UI does not
 * match what was rendered on the server").
 *
 * This wrapper renders a deterministic plain `<span>` on the initial
 * (SSR + first client) pass — the same digits, `prefix`, `suffix`,
 * `className`, and `Intl.NumberFormat('en-US', format)` grouping — and
 * seamlessly swaps into the real animated `<NumberFlow />` after
 * mount, when the DOM is live and safe to animate.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import NumberFlow, { type Format, type Value } from '@number-flow/react';

export interface SafeNumberFlowProps {
  value: Value;
  prefix?: string;
  suffix?: string;
  format?: Format;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Deterministic SSR formatting that mirrors `Intl.NumberFormat('en-US', format)`. */
function formatValue(value: Value, format?: Format): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat('en-US', format).format(n);
}

export default function SafeNumberFlow({
  value,
  prefix,
  suffix,
  format,
  className,
  style,
  children,
}: SafeNumberFlowProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span className={className} style={style}>
        {prefix}
        {formatValue(value, format)}
        {suffix}
        {children}
      </span>
    );
  }

  return (
    <NumberFlow
      value={value}
      prefix={prefix}
      suffix={suffix}
      format={format}
      className={className}
      style={style}
    >
      {children}
    </NumberFlow>
  );
}
