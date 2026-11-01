export default function Footer() {
  return (
    <footer
      style={{
        background: "#4C7A6E",

        borderTop: "3px solid #B08D46",

        padding: "32px",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                background: "#B08D46",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 1.5L9.8 6H14.5L10.5 8.8L12 13.5L8 10.8L4 13.5L5.5 8.8L1.5 6H6.2L8 1.5Z"
                  fill="#24302E"
                />
              </svg>
            </div>
            <span style={{ color: "#F1F0EA", fontWeight: 700, fontSize: 14 }}>
              National Skills Passport
            </span>
          </div>
          <p
            style={{
              color: "rgba(241,240,234,0.5)",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            National Database and Registration Authority
            <br />
            Government of Pakistan
          </p>
        </div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {["Privacy policy", "Accessibility", "Contact"].map((link) => (
            <a
              key={link}
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                color: "rgba(241,240,234,0.5)",
                fontSize: 12,
                textDecoration: "underline",
              }}
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
