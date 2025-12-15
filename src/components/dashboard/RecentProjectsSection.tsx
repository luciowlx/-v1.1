import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ChevronRight } from "lucide-react";

type Project = {
  name: string;
  description: string;
  status: string;
  members: string[];
  startDate: string;
  deadline: string;
};

export function RecentProjectsSection({
  title,
  projects,
  onOpenOverview,
  displayStatus,
  formatRemainingTime,
  calcTimeUsedPercent,
}: {
  title: string;
  projects: Project[];
  onOpenOverview?: () => void;
  displayStatus: (s: string) => string;
  formatRemainingTime: (deadline: string, status: string) => string;
  calcTimeUsedPercent: (startDate: string, deadline: string, status: string) => number;
}) {
  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={onOpenOverview}>查看全部</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.map((project, index) => (
          <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                <p className="text-xs text-gray-500 mt-1 truncate">{project.description}</p>
              </div>
              <Badge 
                variant={project.status === "进行中" ? "default" : "secondary"}
                className="ml-2"
              >
                {displayStatus(project.status)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>剩余时间</span>
                  <span>{formatRemainingTime(project.deadline, project.status)}</span>
                </div>
                <Progress value={calcTimeUsedPercent(project.startDate, project.deadline, project.status)} className="h-2" />
              </div>
              <div className="flex items-center space-x-1">
                {project.members.slice(0, 3).map((member, memberIndex) => (
                  <Avatar key={memberIndex} className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-gray-200">
                      {member}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.members.length > 3 && (
                  <div className="text-xs text-gray-500 ml-1">+{project.members.length - 3}</div>
                )}
              </div>
            </div>
            <div className="mt-2 text-right">
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                查看详情 <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
