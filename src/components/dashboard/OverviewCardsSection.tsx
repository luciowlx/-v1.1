import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BarChart3 } from "lucide-react";

type Item = { label: string; value: number | string };
type CardConf = { title: string; items: Item[]; icon: any; color: string };

export function OverviewCardsSection({ title, cards }: { title: string; cards: CardConf[] }) {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => {
            const IconComp = card.icon as any;
            return (
              <div key={idx} className="p-4 rounded border bg-white">
                <div className="flex items-center gap-2 mb-3">
                  <IconComp className={`h-5 w-5 ${card.color}`} />
                  <div className="text-sm font-medium">{card.title}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {card.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-gray-600">{it.label}</span>
                      <span className="font-medium">{it.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

