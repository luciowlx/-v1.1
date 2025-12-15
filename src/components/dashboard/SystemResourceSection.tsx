import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Cpu } from "lucide-react";

type ResourceItem = { label: string; value: number; icon: any; color: string };

export function SystemResourceSection({ title, resources }: { title: string; resources: ResourceItem[] }) {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Cpu className="h-5 w-5" />{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources.map((rc, i) => {
            const IconComp = rc.icon as any;
            return (
              <div key={i} className="p-4 rounded border bg-white flex items-center gap-4">
                <IconComp className={`h-6 w-6 ${rc.color}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{rc.label}</span>
                    <span className="font-medium">{rc.value}%</span>
                  </div>
                  <Progress value={rc.value} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
