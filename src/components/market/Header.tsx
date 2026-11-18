import { Link } from "@tanstack/react-router";
import { Briefcase, FileText, Heart, Inbox, LogOut, MapPin, Plus, Settings, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ALL_CITIES, CITIES, type Mode } from "@/lib/listings";
import { cn } from "@/lib/utils";

type Props = {
  /** Feed controls; omitted on pages without a feed */
  mode?: Mode;
  onModeChange?: (m: Mode) => void;
  city?: string;
  onCityChange?: (c: string) => void;
  onPost: () => void;
  user: { name: string } | null;
  onLogin: () => void;
  onLogout: () => void;
  favoritesCount: number;
};

export function Logo() {
  return (
    <Link to="/" search={{}} className="flex items-center gap-2" aria-label="Сауда — на главную">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-cta">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M16.5 7.5c-.8-1.2-2.4-2-4.3-2-2.6 0-4.4 1.4-4.4 3.3 0 4.4 9 2.4 9 6.9 0 2-1.9 3.3-4.6 3.3-2 0-3.8-.9-4.7-2.3" />
        </svg>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">сауда</span>
    </Link>
  );
}

export function ModeTabs({ mode, onModeChange, className }: { mode: Mode; onModeChange: (m: Mode) => void; className?: string }) {
  const tabs: { id: Mode; label: string; icon: typeof ShoppingBag }[] = [
    { id: "goods", label: "Объявления", icon: ShoppingBag },
    { id: "jobs", label: "Работа и подработка", icon: Briefcase },
  ];
  return (
    <div role="tablist" aria-label="Раздел" className={cn("flex rounded-xl bg-muted p-1", className)}>
      {tabs.map((t) => {
        const active = t.id === mode;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => onModeChange(t.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all",
              active ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className={cn("size-4", active && "text-primary")} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function Header(p: Props) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-6">
        <Logo />
        {p.mode && p.onModeChange && <ModeTabs mode={p.mode} onModeChange={p.onModeChange} className="hidden md:flex" />}
        <div className="ml-auto flex items-center gap-2">
          {p.city && p.onCityChange && (
          <Select value={p.city} onValueChange={p.onCityChange}>
            <SelectTrigger className="h-9 w-auto gap-1.5 rounded-lg border-transparent bg-muted px-2.5 text-sm shadow-none sm:w-[170px]" aria-label="Город">
              <MapPin className="size-4 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CITIES}>{ALL_CITIES}</SelectItem>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          )}

          <Button onClick={p.onPost} className="hidden h-9 rounded-lg shadow-cta md:inline-flex">
            <Plus /> Подать объявление
          </Button>

          {p.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 rounded-lg px-2 sm:px-3" aria-label="Профиль">
                  <span className="grid size-6 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {p.user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[100px] truncate sm:inline">{p.user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>{p.user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" search={{ tab: "ads" }}>
                    <FileText className="size-4" /> Мои объявления
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" search={{ tab: "applications" }}>
                    <Inbox className="size-4" /> Отклики
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" search={{ tab: "favorites" }}>
                    <Heart className="size-4" /> Избранное
                    <span className="ml-auto text-xs text-muted-foreground">{p.favoritesCount}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile" search={{ tab: "settings" }}>
                    <Settings className="size-4" /> Настройки
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={p.onPost}>
                  <Plus className="size-4" /> Новое объявление
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={p.onLogout}>
                  <LogOut className="size-4" /> Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={p.onLogin} className="h-9 rounded-lg px-2.5 sm:px-3">
              <User /> <span className="hidden sm:inline">Войти</span>
            </Button>
          )}
        </div>
      </div>
      {p.mode && p.onModeChange && (
        <div className="px-4 pb-3 md:hidden">
          <ModeTabs mode={p.mode} onModeChange={p.onModeChange} />
        </div>
      )}
    </header>
  );
}
