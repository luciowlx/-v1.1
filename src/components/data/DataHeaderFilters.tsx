import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Search, Calendar as CalendarIcon, Filter } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface DataHeaderFiltersProps {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  tagQuery: string;
  onTagQueryChange: (v: string) => void;
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
  // 新增项目筛选
  projectFilter: string;
  onProjectFilterChange: (v: string) => void;
  projects: Array<{ id: string; title: string }>;
  onApplyQuery: () => void;
  onResetFilters: () => void;
  t: (key: string) => string;
  formatYYYYMMDD: (d: Date) => string;
}

export function DataHeaderFilters({
  searchTerm,
  onSearchTermChange,
  tagQuery,
  onTagQueryChange,
  dateRange,
  onDateRangeChange,
  projectFilter,
  onProjectFilterChange,
  projects,
  onApplyQuery,
  onResetFilters,
  t,
  formatYYYYMMDD
}: DataHeaderFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative w-[260px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={t('data.search.placeholder')}
          className="w-full pl-10 pr-4 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      <Select value={projectFilter} onValueChange={onProjectFilterChange}>
        <SelectTrigger className="w-[160px] h-10 border-gray-300">
          <SelectValue placeholder="所有项目" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有项目</SelectItem>
          {projects.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <input
        type="text"
        placeholder={t('data.filter.tags.placeholder')}
        className="px-3 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm w-[180px]"
        value={tagQuery}
        onChange={(e) => onTagQueryChange(e.target.value)}
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="px-3 h-10 border border-gray-300 rounded-lg justify-start w-[240px] text-sm"
          >
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span className="truncate">
              {dateRange?.from && dateRange?.to
                ? `${formatYYYYMMDD(dateRange.from)} - ${formatYYYYMMDD(dateRange.to)}`
                : t('data.dateRange.placeholder')}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={dateRange ?? undefined}
            onSelect={(range: DateRange | undefined) => {
              onDateRangeChange(range ?? null);
            }}
          />
        </PopoverContent>
      </Popover>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="h-10 border-gray-300"
          onClick={onApplyQuery}
        >
          <Filter className="h-4 w-4 mr-2" />
          {t('data.filter.query')}
        </Button>

        <Button
          variant="outline"
          className="h-10 border-gray-300"
          onClick={onResetFilters}
        >
          {t('common.reset')}
        </Button>
      </div>
    </div>
  );
}

