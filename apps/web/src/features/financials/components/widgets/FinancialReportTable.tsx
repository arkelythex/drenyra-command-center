import { Card, CardContent } from '@/components/ui/card';
import { cn, n } from '@/lib/utils';
import { FinancialLine } from '../../hooks/useFinancials';

interface FinancialReportTableProps {
  data: FinancialLine[];
}

export const FinancialReportTable = ({ data }: FinancialReportTableProps) => {
  return (
    <Card className="border-border/40 shadow-sm">
        <CardContent className="p-0">
            <table className="w-full text-left border-separate border-spacing-0">
                <thead className="bg-muted/30">
                    <tr>
                        <th className="px-10 py-5 text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50">Cuentas y Partidas NIIF</th>
                        <th className="px-10 py-5 text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50 text-right">Monto</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                    {data.map((line, idx) => (
                        <tr key={idx} className={cn(
                            "group transition-colors duration-200",
                            line.isTotal ? "bg-foreground text-background" : "hover:bg-muted/20"
                        )}>
                            <td className="px-10 py-5">
                                <span className={cn(
                                    "inline-block uppercase tracking-tight transition-[color,transform] duration-200",
                                    line.isTotal ? "font-black text-xs lg:text-sm" : "font-bold text-label text-muted-foreground group-hover:text-foreground",
                                    line.level === 1 && !line.isTotal && "ml-8 pl-4 border-l border-border"
                                )}>
                                    {line.label}
                                </span>
                            </td>
                            <td className="px-10 py-5 text-right">
                                <span className={cn(
                                    "font-black font-mono tracking-tighter tabular-nums transition-[color,opacity] duration-200",
                                    line.isTotal ? "text-base lg:text-lg" : "text-xs text-muted-foreground group-hover:text-foreground",
                                    line.amount < 0 && !line.isTotal && "opacity-60"
                                )}>
                                    {n(line.amount)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </CardContent>
    </Card>
  );
};
