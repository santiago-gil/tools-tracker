interface ToolFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export function ToolFilters({
  categories,
  selectedCategory,
  onCategoryChange,
}: ToolFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onCategoryChange('')}
        className={`filter-btn ${
          selectedCategory === '' ? 'filter-btn-active' : 'filter-btn-inactive'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`filter-btn ${
            selectedCategory === category ? 'filter-btn-active' : 'filter-btn-inactive'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
