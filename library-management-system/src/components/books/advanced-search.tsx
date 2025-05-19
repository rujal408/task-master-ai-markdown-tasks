import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAriaLive, useKeyboardNavigation, ariaLabels, roleAttributes, srOnly } from '@/lib/accessibility';

export interface SearchFilters {
  text: string;
  categories: string[];
  tags: string[];
  availability: 'all' | 'available' | 'checked_out' | 'reserved';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sortBy: 'title' | 'author' | 'date_added' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  categories: string[];
  tags: string[];
  className?: string;
}

export function AdvancedSearch({
  onSearch,
  categories,
  tags,
  className,
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    text: '',
    categories: [],
    tags: [],
    availability: 'all',
    dateRange: {
      from: null,
      to: null,
    },
    sortBy: 'title',
    sortOrder: 'asc',
  });

  const [debouncedText] = useDebounce(filters.text, 500);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleTextSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, text: value }));
    if (value) saveToHistory(value);
  };

  const handleCategoryToggle = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAvailabilityChange = (value: SearchFilters['availability']) => {
    setFilters((prev) => ({ ...prev, availability: value }));
  };

  const handleSortChange = (key: SearchFilters['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key,
      sortOrder: prev.sortBy === key && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const clearFilters = () => {
    setFilters({
      text: '',
      categories: [],
      tags: [],
      availability: 'all',
      dateRange: {
        from: null,
        to: null,
      },
      sortBy: 'title',
      sortOrder: 'asc',
    });
  };

  const saveToHistory = (search: string) => {
    if (search && !searchHistory.includes(search)) {
      setSearchHistory((prev) => [search, ...prev].slice(0, 5));
    }
  };

  // Initialize accessibility hooks after function declarations
  const { announce, ariaLiveProps } = useAriaLive('polite');
  const handleKeyDown = useKeyboardNavigation(
    categories,
    handleCategoryToggle,
    (category) => `category-${category}`
  );

  // Update search when filters change
  useEffect(() => {
    onSearch(filters);
  }, [debouncedText, filters.categories, filters.tags, filters.availability, filters.dateRange, filters.sortBy, filters.sortOrder]);

  // Announce filter changes to screen readers
  useEffect(() => {
    const activeFilters = [
      ...filters.categories,
      ...filters.tags,
      filters.availability !== 'all' ? filters.availability : null,
      filters.dateRange.from ? 'date range' : null,
    ].filter(Boolean);

    if (activeFilters.length > 0) {
      announce(`Active filters: ${activeFilters.join(', ')}`);
    }
  }, [filters, announce]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Screen reader announcements */}
      <div 
        className={srOnly}
        aria-live="polite"
        aria-atomic="true"
        aria-relevant="text"
      />

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search books..."
            value={filters.text}
            onChange={(e) => handleTextSearch(e.target.value)}
            className="pl-9"
            aria-label={ariaLabels.search}
          />
        </div>
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              aria-label={ariaLabels.filter}
              aria-expanded={isFilterOpen}
              aria-controls="filter-popover"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            id="filter-popover"
            className="w-80 p-4" 
            align="end"
            {...roleAttributes.dialog}
          >
            <div className="space-y-4">
              {/* Categories */}
              <div>
                <h4 className="mb-2 text-sm font-medium" id="categories-heading">Categories</h4>
                <div 
                  className="flex flex-wrap gap-2"
                  role="listbox"
                  aria-labelledby="categories-heading"
                  aria-multiselectable="true"
                >
                  {categories.map((category, index) => (
                    <Badge
                      key={category}
                      id={`category-${category}`}
                      variant={filters.categories.includes(category) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleCategoryToggle(category)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      role="option"
                      aria-selected={filters.categories.includes(category)}
                      tabIndex={0}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="mb-2 text-sm font-medium" id="tags-heading">Tags</h4>
                <div 
                  className="flex flex-wrap gap-2"
                  role="listbox"
                  aria-labelledby="tags-heading"
                  aria-multiselectable="true"
                >
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleTagToggle(tag)}
                      role="option"
                      aria-selected={filters.tags.includes(tag)}
                      tabIndex={0}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="mb-2 text-sm font-medium" id="availability-heading">Availability</h4>
                <div 
                  className="flex gap-2"
                  role="radiogroup"
                  aria-labelledby="availability-heading"
                >
                  {(['all', 'available', 'checked_out', 'reserved'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={filters.availability === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAvailabilityChange(status)}
                      role="radio"
                      aria-checked={filters.availability === status}
                      tabIndex={0}
                    >
                      {status.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h4 className="mb-2 text-sm font-medium" id="date-range-heading">Publication Date</h4>
                <div 
                  className="grid gap-2"
                  aria-labelledby="date-range-heading"
                >
                  <Calendar
                    mode="range"
                    selected={{
                      from: filters.dateRange.from || undefined,
                      to: filters.dateRange.to || undefined,
                    }}
                    onSelect={(range) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: {
                          from: range?.from || null,
                          to: range?.to || null,
                        },
                      }))
                    }
                    aria-label="Select publication date range"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h4 className="mb-2 text-sm font-medium" id="sort-heading">Sort By</h4>
                <div 
                  className="flex gap-2"
                  role="radiogroup"
                  aria-labelledby="sort-heading"
                >
                  {(['title', 'author', 'date_added', 'popularity'] as const).map((key) => (
                    <Button
                      key={key}
                      variant={filters.sortBy === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSortChange(key)}
                      role="radio"
                      aria-checked={filters.sortBy === key}
                      tabIndex={0}
                    >
                      {key.replace('_', ' ')}
                      {filters.sortBy === key && (
                        <span className="ml-1" aria-hidden="true">
                          {filters.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={clearFilters}
                aria-label={ariaLabels.clearFilters}
              >
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                Clear Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div 
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Recent searches"
        >
          {searchHistory.map((term) => (
            <Badge
              key={term}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleTextSearch(term)}
              role="listitem"
              tabIndex={0}
            >
              {term}
            </Badge>
          ))}
        </div>
      )}

      {/* Active Filters */}
      {(filters.categories.length > 0 ||
        filters.tags.length > 0 ||
        filters.availability !== 'all' ||
        filters.dateRange.from ||
        filters.dateRange.to) && (
        <div 
          className="flex flex-wrap gap-2"
          role="list"
          aria-label="Active filters"
        >
          {filters.categories.map((category) => (
            <Badge
              key={category}
              variant="default"
              className="cursor-pointer"
              onClick={() => handleCategoryToggle(category)}
              role="listitem"
              tabIndex={0}
            >
              {category} <span className={srOnly}>Remove filter</span> ×
            </Badge>
          ))}
          {filters.tags.map((tag) => (
            <Badge
              key={tag}
              variant="default"
              className="cursor-pointer"
              onClick={() => handleTagToggle(tag)}
              role="listitem"
              tabIndex={0}
            >
              {tag} <span className={srOnly}>Remove filter</span> ×
            </Badge>
          ))}
          {filters.availability !== 'all' && (
            <Badge
              variant="default"
              className="cursor-pointer"
              onClick={() => handleAvailabilityChange('all')}
              role="listitem"
              tabIndex={0}
            >
              {filters.availability.replace('_', ' ')} <span className={srOnly}>Remove filter</span> ×
            </Badge>
          )}
          {filters.dateRange.from && (
            <Badge
              variant="default"
              className="cursor-pointer"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  dateRange: { from: null, to: null },
                }))
              }
              role="listitem"
              tabIndex={0}
            >
              {format(filters.dateRange.from, 'MMM d, yyyy')}
              {filters.dateRange.to && ` - ${format(filters.dateRange.to, 'MMM d, yyyy')}`}
              <span className={srOnly}>Remove date filter</span> ×
            </Badge>
          )}
        </div>
      )}
    </div>
  );
} 