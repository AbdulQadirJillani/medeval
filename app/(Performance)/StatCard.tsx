import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function StatCard({
  title,
  value,
  icon,
  subtitle,
  className = "",
}: {
  title: string;
  value: string;
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <Card className={`rounded-2xl shadow-accent shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2">
          {icon && <span className="text-lg sm:text-xl">{icon}</span>}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight break-words">
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
