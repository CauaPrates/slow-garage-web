import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export function initialsFrom(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return initials.toUpperCase();
}

type UserAvatarProps = {
  avatarUrl: string | null;
  displayName: string | null;
  className?: string;
};

/** Foto real (`avatar_url`) > iniciais do nome de exibição > ícone genérico — nessa ordem, nunca inventando uma das duas primeiras quando falta dado. Decorativo: o nome sempre aparece em texto ao lado. */
export function UserAvatar({ avatarUrl, displayName, className }: UserAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-xs font-medium text-text-primary ring-1 ring-border",
        className,
      )}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : displayName?.trim() ? (
        initialsFrom(displayName)
      ) : (
        <User className="h-4 w-4 text-text-secondary" />
      )}
    </span>
  );
}
