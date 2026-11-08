import BrandLogo from "./BrandLogo"

interface NavBarProps {
  breadcrumbs?: { label: string onClick?: () => void }[]
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
          <BrandLogo size={28} />
          <span
            style={{
              color: "#F1F0EA",
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: "-0.01em",
            }}
          >
            NSP HUNAR
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
