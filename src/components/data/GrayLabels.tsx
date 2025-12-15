import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function GrayLabels({ items }: { items: Array<{ name: string }> }) {
  const max = 3;
  const visible = items.slice(0, max);
  const extra = items.slice(max);
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((it, idx) => (
        <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
          {it.name}
        </Badge>
      ))}
      {extra.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 cursor-help">+{extra.length}</Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm text-gray-800 max-w-xs">
              {extra.map(e => e.name).join('、')}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

