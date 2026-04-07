"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { ResponsiveGridLayout } from "react-grid-layout";
import { useDashboard } from "@/context/dashboard-context";
import { WidgetWrapper } from "@/components/widgets/widget-wrapper";
import { WidgetPicker } from "@/components/widgets/widget-picker";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// Cast to any to handle type mismatches between react-grid-layout v2 and @types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Grid = ResponsiveGridLayout as any;

export default function DashboardPage() {
  const { widgets, layouts, editMode, showPicker, updateLayouts } = useDashboard();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setWidth(el.offsetWidth);
    return () => observer.disconnect();
  }, []);

  const handleLayoutChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_current: any, allLayouts: any) => {
      updateLayouts(allLayouts);
    },
    [updateLayouts]
  );

  return (
    <div ref={containerRef}>
      <Grid
        className="layout"
        width={width}
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 8, sm: 4, xs: 2 }}
        rowHeight={50}
        isDraggable={editMode}
        isResizable={editMode}
        draggableHandle=".drag-handle"
        containerPadding={[0, 0]}
        margin={[12, 12]}
        useCSSTransforms
      >
        {widgets.map((widget) => (
          <div key={widget.id} className={editMode ? "ring-2 ring-primary/30 rounded-lg" : ""}>
            <WidgetWrapper config={widget} />
          </div>
        ))}
      </Grid>

      {showPicker && <WidgetPicker />}
    </div>
  );
}
