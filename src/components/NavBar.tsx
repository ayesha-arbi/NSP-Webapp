interface NavBarProps {
  breadcrumbs?: { label: string; onClick?: () => void }[]
}

export default function NavBar({ breadcrumbs }: NavBarProps) {
  return (
    <>
      <nav
        style={{
          background: "#4C7A6E",

          height: 56,

          display: "flex",
          alignItems: "center",

          padding: "0 32px",

          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: "#B08D46",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5L9.8 6H14.5L10.5 8.8L12 13.5L8 10.8L4 13.5L5.5 8.8L1.5 6H6.2L8 1.5Z"
                fill="#24302E"
              />
            </svg>
          </div>
          <span
            style={{
              color: "#F1F0EA",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "-0.01em",
            }}
          >
            National Skills Passport
          </span>
          <span
            style={{
              color: "rgba(241,240,234,0.3)",
              fontSize: 14,
              marginLeft: 4,
            }}
          >
            —
          </span>
          <span style={{ color: "#B08D46", fontSize: 13, fontWeight: 500 }}>
            Verifier Portal
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ color: "rgba(241,240,234,0.35)", fontSize: 12 }}>
            NADRA, Pakistan
          </span>
        </div>
      </nav>

      {breadcrumbs && breadcrumbs.length > 0 && (
        <div
          style={{ background: "#FFFFFF", borderBottom: "1px solid #D6D3C6" }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "0 32px",
              height: 40,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {breadcrumbs.map((crumb, i) => (
              <span
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                {i > 0 && (
                  <span style={{ color: "#D6D3C6", fontSize: 12 }}>/</span>
                )}
                {crumb.onClick ? (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      crumb.onClick?.()
                    }}
                    style={{
                      color: "#24302E",
                      fontSize: 13,
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.textDecoration = "underline")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.textDecoration = "none")
                    }
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span style={{ color: "#8C897C", fontSize: 13 }}>
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
