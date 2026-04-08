"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { ResponsiveGridLayout } from "react-grid-layout";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/context/dashboard-context";
import { WidgetWrapper } from "./widget-wrapper";
import { WidgetPicker } from "./widget-picker";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { externalLinks } from "@/lib/external-links";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Grid = ResponsiveGridLayout as any;

interface WidgetPageProps {
  title?: string;
  description?: string;
  headerContent?: React.ReactNode;
}

export function WidgetPage({ title, description, headerContent }: WidgetPageProps) {
  const pathname = usePathname();
  const { widgets, layouts, editMode, showPicker, updateLayouts } = useDashboard();
  const sources = externalLinks[pathname || "/"] || [];
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
      {(title || headerContent) && (
        <div className="mb-4">
          {title && <h2 className="text-lg font-bold text-foreground">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          {sources.length > 0 && <DataSourceBadge sources={sources} />}
          {headerContent}
        </div>
      )}

      <Grid
        className="layout"
        width={width}
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 900, md: 600, sm: 400, xs: 0 }}
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
