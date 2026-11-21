import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  icon,
  subtitle,
  className,
  valueClassName,
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <Card className={cn("rounded-2xl shadow-accent shadow-sm hover:shadow-md transition-shadow duration-200", className)}>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2">
          {icon && <span className="text-lg sm:text-xl">{icon}</span>}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight break-words", valueClassName)}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;
