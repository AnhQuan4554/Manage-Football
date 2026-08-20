import Image from "next/image";

type LogoLoadingProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
};

const sizeClassName: Record<NonNullable<LogoLoadingProps["size"]>, string> = {
  sm: "logo-loading-sm",
  md: "logo-loading-md",
  lg: "logo-loading-lg",
};

export function LogoLoading({ label = "Đang tải dữ liệu...", size = "md", fullPage = false }: LogoLoadingProps) {
  const className = [
    "logo-loading",
    sizeClassName[size],
    fullPage ? "logo-loading-full" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true">
      <span className="logo-loading-mark" aria-hidden="true">
        <span className="logo-loading-ring" />
        <Image
          src="/logo-transparent.png"
          alt=""
          width={96}
          height={84}
          className="logo-loading-image"
          priority={fullPage}
        />
      </span>
      {label ? <span className="logo-loading-label">{label}</span> : null}
    </div>
  );
}
