import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Activity } from "lucide-react";
import { Badge } from "../ui/badge";

type ActivityItem = {
  timeRel: string;
  timeAbs: string;
  type: string;
  description: string;
  related: string;
  status: string;
  statusMsg?: string;
};

export function RecentActivitiesSection({
  title,
  activities,
  typeStyle,
  statusClass,
  onOpenAll,
  displayStatus,
}: {
  title: string;
  activities: ActivityItem[];
  typeStyle: Record<string, { icon: any; color: string }>;
  statusClass: Record<string, string>;
  onOpenAll?: () => void;
  displayStatus: (s: string) => string;
}) {
  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={onOpenAll}>查看全部</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity, index) => {
          const style = typeStyle[activity.type] || { icon: Activity, color: "text-gray-600" };
          const IconComp = style.icon as any;
          return (
            <div key={index} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-start gap-3">
                <IconComp className={`h-5 w-5 ${style.color} mt-1`} />
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <div className="mt-1 text-xs">
                    <button className="text-blue-600 hover:underline">{activity.related}</button>
                    <Badge variant="secondary" className={`ml-2 ${statusClass[activity.status]}`}>{displayStatus(activity.status)}</Badge>
                  </div>
                  {activity.status === '失败' && activity.statusMsg && (
                    <p className="text-xs text-red-600 mt-1">{activity.statusMsg}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500" title={activity.timeAbs}>{activity.timeRel}</span>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">查看详情</Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

