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
        className={`px-4 py-2 rounded-lg font-medium transition ${
          selectedCategory === '' ? 'btn-primary' : 'btn-secondary'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            selectedCategory === category ? 'btn-primary' : 'btn-secondary'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
