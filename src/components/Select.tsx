import React, { useState, useRef, useEffect, useCallback } from "react"

interface Option {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  style?: React.CSSProperties
  disabled?: boolean
  placeholder?: string
}

export default function Select({
  value,
  onChange,
  options,
  style,
  disabled,
  placeholder,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const displayLabel = selected?.label ?? placeholder ?? ""

  const close = useCallback(() => {
    setOpen(false)
    setHighlighted(null)
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        close()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open, close])

  useEffect(() => {
    if (open && listRef.current) {
      const active = listRef.current.querySelector(
        '[data-selected="true"]',
      ) as HTMLElement | null
      active?.scrollIntoView({ block: "nearest" })
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    const enabledOpts = options.filter((o) => !o.disabled)
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      close()
      return
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      if (highlighted) {
        onChange(highlighted)
        close()
      }
      return
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()
      const idx = enabledOpts.findIndex(
        (o) => o.value === (highlighted ?? value),
      )
      const next =
        e.key === "ArrowDown"
          ? enabledOpts[Math.min(idx + 1, enabledOpts.length - 1)]
          : enabledOpts[Math.max(idx - 1, 0)]
      if (next) setHighlighted(next.value)
    }
  }

  const triggerBase: React.CSSProperties = {
    height: 36,
    padding: "0 32px 0 10px",
    border: "1px solid #D6D3C6",
    borderRadius: 6,
    fontSize: 13,
    color: disabled ? "#8C897C" : "#24302E",
    background: disabled ? "#F1F0EA" : "#fff",
    cursor: disabled ? "default" : "pointer",
    display: "flex",
    alignItems: "center",
    userSelect: "none",
    position: "relative",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxSizing: "border-box",
    minWidth: 100,
    outline: "none",
    ...style,
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        ...(style?.width ? { width: style.width } : {}),
      }}
    >
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setOpen((o) => !o)
        }}
        onKeyDown={handleKeyDown}
        style={{
          ...triggerBase,
          borderColor: open ? "#4C7A6E" : "#D6D3C6",
          boxShadow: open ? "0 0 0 2px #B08D46" : "none",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {displayLabel}
        </span>
        {/* Chevron */}
        <span
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
            transition: "transform 0.15s",
            color: "#8C897C",
            display: "flex",
            pointerEvents: "none",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={listRef}
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            background: "#fff",
            border: "1px solid #D6D3C6",
            borderRadius: 6,
            boxShadow: "0 8px 24px rgba(76,122,110,0.12)",
            zIndex: 9999,
            maxHeight: 240,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            const isHl = opt.value === (highlighted ?? value)
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                onMouseEnter={() => !opt.disabled && setHighlighted(opt.value)}
                onMouseLeave={() => setHighlighted(null)}
                onClick={() => {
                  if (!opt.disabled) {
                    onChange(opt.value)
                    close()
                  }
                }}
                style={{
                  padding: "8px 12px",
                  fontSize: 13,
                  cursor: opt.disabled ? "default" : "pointer",
                  color: opt.disabled
                    ? "#C0BDBD"
                    : isHl
                      ? "#fff"
                      : isSelected
                        ? "#4C7A6E"
                        : "#24302E",
                  background: isHl && !opt.disabled ? "#4C7A6E" : "transparent",
                  fontWeight: isSelected ? 600 : 400,
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {opt.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
