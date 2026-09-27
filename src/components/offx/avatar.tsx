import { cn } from "@/lib/cn";
import { hueStyle, initials } from "@/lib/offx/format";
import { OffxMark } from "./logo";

export function UserAvatar({
  name,
  hue,
  src,
  size = "md",
  system,
  className,
}: {
  name: string;
  hue: number;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  system?: boolean;
  className?: string;
}) {
  const dim =
    size === "sm"
      ? "size-8 text-[10px]"
      : size === "lg"
        ? "size-14 text-lg"
        : size === "xl"
          ? "size-20 text-xl"
          : "size-11 text-xs";
  if (system && (name === "Offchat" || name === "OffX")) {
    return (
      <span
        className={cn(
          "grid place-items-center rounded-full bg-elevated text-fg shadow-[var(--shadow-border)]",
          dim,
          className,
        )}
      >
        <OffxMark className="h-[55%] w-[70%]" />
      </span>
    );
  }
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn("rounded-full object-cover", dim, className)}
      />
    );
  }
  const style = hueStyle(hue);
  return (
    <span
      className={cn(
        "grid place-items-center rounded-full font-medium tracking-wide",
        dim,
        className,
      )}
      style={style}
    >
      {initials(name)}
    </span>
  );
}
