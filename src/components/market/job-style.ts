import { Bike, Briefcase, GraduationCap, Laptop, type LucideIcon } from "lucide-react";

export const JOB_STYLE: Record<string, { icon: LucideIcon; tint: string }> = {
  Подработка: { icon: Bike, tint: "bg-job-gig text-job-gig-foreground" },
  "Полный день": { icon: Briefcase, tint: "bg-job-full text-job-full-foreground" },
  Удаленка: { icon: Laptop, tint: "bg-job-remote text-job-remote-foreground" },
  Стажировка: { icon: GraduationCap, tint: "bg-job-intern text-job-intern-foreground" },
};

const FALLBACK = { icon: Briefcase, tint: "bg-job-full text-job-full-foreground" };
export const jobStyle = (category: string) => JOB_STYLE[category] ?? FALLBACK;
