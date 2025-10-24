import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, memo, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface DynamicVirtualizedListProps<T> {
  items: T[];
  defaultItemHeight: number;
  containerHeight: number | string;
  renderItem: ({ item, index }: { item: T; index: number }) => ReactNode;
  className?: string;
  overscan?: number;
  onItemHeightChange?: (index: number, height: number) => void;
}

export const DynamicVirtualizedList = memo(function DynamicVirtualizedList<T>({
  items,
  defaultItemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onItemHeightChange,
}: DynamicVirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());

  const getItemHeight = useCallback(
    (index: number) => {
      return itemHeights.get(index) ?? defaultItemHeight;
    },
    [itemHeights, defaultItemHeight],
  );

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: getItemHeight,
    overscan,
  });

  // Update item height when it changes
  const handleItemHeightChange = useCallback(
    (index: number, height: number) => {
      setItemHeights((prev) => {
        const newMap = new Map(prev);
        newMap.set(index, height);
        return newMap;
      });
      onItemHeightChange?.(index, height);
    },
    [onItemHeightChange],
  );

  // Force virtualizer to recalculate when heights change
  useEffect(() => {
    virtualizer.measure();
  }, [itemHeights, virtualizer]);

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{
        height: typeof containerHeight === 'string' ? containerHeight : containerHeight,
        minHeight: typeof containerHeight === 'number' ? containerHeight : undefined,
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <DynamicItemWrapper
              index={virtualItem.index}
              onHeightChange={handleItemHeightChange}
            >
              {renderItem({
                item: items[virtualItem.index],
                index: virtualItem.index,
              })}
            </DynamicItemWrapper>
          </div>
        ))}
      </div>
    </div>
  );
}) as <T>(props: DynamicVirtualizedListProps<T>) => JSX.Element;

// Component to measure and report height changes
interface DynamicItemWrapperProps {
  index: number;
  onHeightChange: (index: number, height: number) => void;
  children: ReactNode;
}

const DynamicItemWrapper = memo(function DynamicItemWrapper({
  index,
  onHeightChange,
  children,
}: DynamicItemWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        onHeightChange(index, height);
      }
    });

    resizeObserver.observe(element);

    // Initial measurement
    const height = element.getBoundingClientRect().height;
    onHeightChange(index, height);

    return () => {
      resizeObserver.disconnect();
    };
  }, [index, onHeightChange]);

  return <div ref={ref}>{children}</div>;
});
