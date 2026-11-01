import { CSSProperties, ReactNode } from "react"

interface BtnProps {
  children: ReactNode

  onClick?: () => void

  disabled?: boolean

  type?: "button" | "submit"

  style?: CSSProperties
}

export function BtnPrimary({ children, onClick, disabled, style }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,

        background: disabled ? "#8C897C" : "#4C7A6E",

        color: "#FFFFFF",

        border: "none",

        borderRadius: 6,

        padding: "10px 20px",

        minHeight: 40,

        fontSize: 14,
        fontWeight: 600,

        cursor: disabled ? "not-allowed" : "pointer",

        fontFamily: "inherit",

        transition: "background 0.15s",

        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLElement).style.background = "#3F6459"
      }}
      onMouseLeave={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLElement).style.background = "#4C7A6E"
      }}
    >
      {children}
    </button>
  )
}

export function BtnSecondary({ children, onClick, disabled, style }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,

        background: "#FFFFFF",

        color: "#24302E",

        border: "1px solid #D6D3C6",

        borderRadius: 6,

        padding: "10px 20px",

        minHeight: 40,

        fontSize: 14,
        fontWeight: 600,

        cursor: disabled ? "not-allowed" : "pointer",

        fontFamily: "inherit",

        transition: "background 0.15s",

        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLElement).style.background = "#E4E2D9"
      }}
      onMouseLeave={(e) => {
        if (!disabled)
          (e.currentTarget as HTMLElement).style.background =
            style?.background as string ?? "#FFFFFF"
      }}
    >
      {children}
    </button>
  )
}
