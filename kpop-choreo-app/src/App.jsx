import { useMemo, useRef, useState } from "react";

export default function App() {
  // Stage size (in SVG units)
  const STAGE_W = 1000;
  const STAGE_H = 600;

  // Grid settings
  const gridSize = 40;

  // Ref to the SVG element so we can convert mouse coords -> SVG coords
  const svgRef = useRef(null);

  // Dancers: circles you can drag
  const [dancers, setDancers] = useState([
    { id: "d1", name: "1", x: 250, y: 220, r: 22, color: "#ff4d6d" },
    { id: "d2", name: "2", x: 350, y: 260, r: 22, color: "#4d79ff" },
    { id: "d3", name: "3", x: 500, y: 300, r: 22, color: "#34c759" },
    { id: "d4", name: "4", x: 650, y: 260, r: 22, color: "#ffb020" },
    { id: "d5", name: "5", x: 750, y: 220, r: 22, color: "#a855f7" },
  ]);

  // Track dragging state
  const [dragId, setDragId] = useState(null);
  const dragOffsetRef = useRef({ dx: 0, dy: 0 });

  // Build the grid lines once (memoized)
  const gridLines = useMemo(() => {
    const lines = [];

    for (let x = 0; x <= STAGE_W; x += gridSize) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={STAGE_H}
          stroke="#e8e8e8"
          strokeWidth={1}
        />
      );
    }

    for (let y = 0; y <= STAGE_H; y += gridSize) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={STAGE_W}
          y2={y}
          stroke="#e8e8e8"
          strokeWidth={1}
        />
      );
    }

    return lines;
  }, [STAGE_W, STAGE_H, gridSize]);

  // Convert screen coords to SVG coords (important for accurate dragging)
  function getSvgPoint(clientX, clientY) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const pt = new DOMPoint(clientX, clientY);
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    const inv = ctm.inverse();
    const sp = pt.matrixTransform(inv);
    return { x: sp.x, y: sp.y };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Start dragging a dancer
  function onDancerPointerDown(e, dancerId) {
    e.preventDefault();
    e.stopPropagation();

    const p = getSvgPoint(e.clientX, e.clientY);
    const dancer = dancers.find((d) => d.id === dancerId);
    if (!dancer) return;

    // Save where inside the circle we clicked so it doesn't "jump"
    dragOffsetRef.current = { dx: p.x - dancer.x, dy: p.y - dancer.y };
    setDragId(dancerId);

    // Capture pointer so dragging continues even if mouse leaves the circle
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  // Drag move (on the SVG)
  function onStagePointerMove(e) {
    if (!dragId) return;

    const p = getSvgPoint(e.clientX, e.clientY);
    const { dx, dy } = dragOffsetRef.current;

    setDancers((prev) =>
      prev.map((d) => {
        if (d.id !== dragId) return d;

        // Keep dancer inside stage bounds
        const newX = clamp(p.x - dx, d.r, STAGE_W - d.r);
        const newY = clamp(p.y - dy, d.r, STAGE_H - d.r);

        return { ...d, x: newX, y: newY };
      })
    );
  }

  // Stop dragging
  function onStagePointerUp() {
    setDragId(null);
  }

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, Arial" }}>
      <h1 style={{ margin: "0 0 8px" }}>K-Pop Choreo Formation Editor</h1>
      <p style={{ margin: "0 0 12px", color: "#555" }}>
        Drag the circles to create a formation.
      </p>

      <div
        style={{
          width: "100%",
          maxWidth: 980,
          border: "1px solid #ddd",
          borderRadius: 12,
          overflow: "hidden",
          background: "#fafafa",
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            background: "white",
            touchAction: "none", // important for touch dragging
          }}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          onPointerLeave={onStagePointerUp}
        >
          {/* Grid */}
          <g>{gridLines}</g>

          {/* Stage border */}
          <rect
            x={0}
            y={0}
            width={STAGE_W}
            height={STAGE_H}
            fill="none"
            stroke="#111"
            strokeWidth={2}
          />

          {/* “Front of stage” marker */}
          <text
            x={STAGE_W / 2}
            y={28}
            textAnchor="middle"
            fontSize={18}
            fill="#111"
          >
            FRONT (Audience)
          </text>

          {/* Center marker */}
          <circle cx={STAGE_W / 2} cy={STAGE_H / 2} r={6} fill="#111" />
          <text
            x={STAGE_W / 2 + 10}
            y={STAGE_H / 2 + 5}
            fontSize={14}
            fill="#111"
          >
            Center
          </text>

          {/* Dancers */}
          <g>
            {dancers.map((d) => (
              <g
                key={d.id}
                style={{ cursor: dragId === d.id ? "grabbing" : "grab" }}
                onPointerDown={(e) => onDancerPointerDown(e, d.id)}
              >
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={d.r}
                  fill={d.color}
                  stroke="#111"
                  strokeWidth={2}
                />
                <text
                  x={d.x}
                  y={d.y + 6}
                  textAnchor="middle"
                  fontSize={16}
                  fill="white"
                  style={{ userSelect: "none", pointerEvents: "none" }}
                >
                  {d.name}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div style={{ marginTop: 10, color: "#666", fontSize: 14 }}>
        Currently dragging: <b>{dragId ?? "none"}</b>
      </div>
    </div>
  );
}
