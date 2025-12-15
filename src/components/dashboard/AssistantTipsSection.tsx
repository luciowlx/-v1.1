import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Lightbulb } from "lucide-react";

export function AssistantTipsSection({ title, tips }: { title: string; tips: string[] }) {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5" />{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-700">基于最近项目的用量，建议如下操作：</p>
        <ol className="list-decimal pl-6 space-y-3 text-sm text-gray-800">
          {tips.map((tip, i) => (
            <li key={i} className="leading-6">
              {tip}
            </li>
          ))}
        </ol>
        <div className="pt-2">
          <Button className="mx-auto block px-6 py-3 rounded-full bg-black text-red-500 hover:bg-gray-900 text-sm">
            忽略建议
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
