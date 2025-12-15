import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export function DashboardHeader({ welcomeText }: { welcomeText: string }) {
  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">LimiX通用数据分析平台</span>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700">{welcomeText}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

