import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Search, Calendar as CalendarIcon, Filter } from "lucide-react";
import type { DateRange } from "react-day-picker";

interface DataHeaderFiltersProps {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  tagQuery: string;
  onTagQueryChange: (v: string) => void;
  dateRange: DateRange | null;
  onDateRangeChange: (range: DateRange | null) => void;
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
  onApplyQuery,
  onResetFilters,
  t,
  formatYYYYMMDD
}: DataHeaderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder={t('data.search.placeholder')}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder={t('data.filter.tags.placeholder')}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          value={tagQuery}
          onChange={(e) => onTagQueryChange(e.target.value)}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="px-3 py-2 border border-gray-300 rounded-lg justify-start min-w-[260px]"
            >
              <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
              {dateRange?.from && dateRange?.to
                ? `${formatYYYYMMDD(dateRange.from)} - ${formatYYYYMMDD(dateRange.to)}`
                : t('data.dateRange.placeholder')}
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

        <Button
          variant="outline"
          size="sm"
          onClick={onApplyQuery}
        >
          <Filter className="h-4 w-4 mr-2" />
          {t('data.filter.query')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
        >
          {t('common.reset')}
        </Button>
      </div>
    </div>
  );
}

