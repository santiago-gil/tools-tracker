import { useVirtualizer } from '@tanstack/react-virtual';
import {
  useRef,
  memo,
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import type { ReactNode } from 'react';

const LAST_ITEMS_THRESHOLD = 3;

interface DynamicVirtualizedListProps<T> {
  items: T[];
  defaultItemHeight: number;
  containerHeight: number | string;
  renderItem: ({ item, index }: { item: T; index: number }) => ReactNode;
  className?: string;
  overscan?: number;
  onItemHeightChange?: (index: number, height: number) => void;
}

export interface DynamicVirtualizedListHandle {
  scrollToIndex: (index: number) => void;
  measure: () => void;
}

function DynamicVirtualizedListInner<T>(
  {
    items,
    defaultItemHeight,
    containerHeight,
    renderItem,
    className = '',
    overscan = 5,
    onItemHeightChange,
  }: DynamicVirtualizedListProps<T>,
  ref: React.ForwardedRef<DynamicVirtualizedListHandle>,
) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const measureRafRef = useRef<number | null>(null);

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

  // Expose scroll method via ref
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index: number) => {
        // Check if item is near the bottom of the list
        const totalItems = items.length;
        const isLastItems = index >= totalItems - LAST_ITEMS_THRESHOLD; // Last 3 items

        try {
          if (isLastItems) {
            // Align to end so expanded content is fully visible
            virtualizer.scrollToIndex(index, {
              align: 'end',
              behavior: 'auto',
            });
          } else {
            // For other items, use center alignment for better visibility
            virtualizer.scrollToIndex(index, {
              align: 'center',
              behavior: 'auto',
            });
          }
        } catch (error) {
          console.error('virtualizer.scrollToIndex error:', error);
        }
      },
      measure: () => {
        virtualizer.measure();
      },
    }),
    [virtualizer, items.length],
  );

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

  // Force virtualizer to recalculate when heights change (using RAF to batch updates)
  useEffect(() => {
    if (measureRafRef.current) {
      cancelAnimationFrame(measureRafRef.current);
    }

    measureRafRef.current = requestAnimationFrame(() => {
      virtualizer.measure();
      measureRafRef.current = null;
    });

    return () => {
      if (measureRafRef.current) {
        cancelAnimationFrame(measureRafRef.current);
      }
    };
  }, [itemHeights, virtualizer]);

  return (
    <div
      ref={parentRef}
      className={`overflow-y-auto ${className}`}
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
}

const DynamicVirtualizedListInnerWithRef = forwardRef(DynamicVirtualizedListInner) as <T>(
  props: DynamicVirtualizedListProps<T> & {
    ref?: React.Ref<DynamicVirtualizedListHandle>;
  },
) => JSX.Element;

export const DynamicVirtualizedList = memo(
  DynamicVirtualizedListInnerWithRef,
  (prevProps, nextProps) => {
    return (
      prevProps.items === nextProps.items &&
      prevProps.defaultItemHeight === nextProps.defaultItemHeight &&
      prevProps.containerHeight === nextProps.containerHeight &&
      prevProps.overscan === nextProps.overscan
    );
  },
) as typeof DynamicVirtualizedListInnerWithRef;

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
