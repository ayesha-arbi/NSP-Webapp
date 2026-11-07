interface BrandLogoProps {
  size?: number
  alt?: string
}

export default function BrandLogo({
  size = 28,
  alt = "NSP HUNAR logo",
}: BrandLogoProps) {
  return (
    <img
      src="/logo.jpeg"
      alt={alt}
      width={size}
      height={size}
      style={{
        width: size,
        height: "auto",
        maxHeight: size,
        objectFit: "contain",
        display: "block",
        flexShrink: 0,
      }}
    />
  )
}
