/**
 * Inline toolbar icons (24×24 viewBox, rendered at 15×15).
 * Built with createElementNS so callers avoid innerHTML.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

interface PathSpec {
  d: string;
  fill?: string;
  fillOpacity?: string;
  stroke?: string;
  strokeWidth?: string;
  strokeLinecap?: string;
  strokeLinejoin?: string;
}

interface SvgRootAttrs {
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  strokeLinecap?: string;
  strokeLinejoin?: string;
}

function makeSvg(paths: readonly PathSpec[], root: SvgRootAttrs = {}): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", "15");
  svg.setAttribute("height", "15");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  if (root.fill !== undefined) svg.setAttribute("fill", root.fill);
  if (root.stroke !== undefined) svg.setAttribute("stroke", root.stroke);
  if (root.strokeWidth !== undefined) svg.setAttribute("stroke-width", root.strokeWidth);
  if (root.strokeLinecap !== undefined) svg.setAttribute("stroke-linecap", root.strokeLinecap);
  if (root.strokeLinejoin !== undefined) svg.setAttribute("stroke-linejoin", root.strokeLinejoin);

  for (const spec of paths) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", spec.d);
    if (spec.fill !== undefined) path.setAttribute("fill", spec.fill);
    if (spec.fillOpacity !== undefined) path.setAttribute("fill-opacity", spec.fillOpacity);
    if (spec.stroke !== undefined) path.setAttribute("stroke", spec.stroke);
    if (spec.strokeWidth !== undefined) path.setAttribute("stroke-width", spec.strokeWidth);
    if (spec.strokeLinecap !== undefined) path.setAttribute("stroke-linecap", spec.strokeLinecap);
    if (spec.strokeLinejoin !== undefined) path.setAttribute("stroke-linejoin", spec.strokeLinejoin);
    svg.append(path);
  }
  return svg;
}

const SPEAK_PATHS: readonly PathSpec[] = [
  {
    d: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.06c1.48-.74 2.5-2.26 2.5-4.03zM14 3.23v2.06c4.01 1.11 7 4.9 7 8.77s-2.99 7.66-7 8.77v-2.06c2.89-.86 5-3.54 5-6.71s-2.11-5.85-5-6.71V3.23z",
    fill: "currentColor",
  },
];

const REPORT_PATHS: readonly PathSpec[] = [
  {
    d: "M12 2 2 20h20L12 2zm0 3.5 6.5 11.5h-13L12 5.5z",
    fill: "currentColor",
  },
  {
    d: "M11 10v4h2v-4h-2zm0 6v2h2v-2h-2z",
    fill: "currentColor",
  },
];

const REPORT_DONE_PATH: PathSpec = {
  d: "M20 6 9 17l-5-5",
};

/** Volume / speaker. */
export function createSpeakIcon(): SVGSVGElement {
  return makeSvg(SPEAK_PATHS);
}

/** Alert triangle for “report broken word”. */
export function createReportIcon(): SVGSVGElement {
  return makeSvg(REPORT_PATHS);
}

/** Checkmark shown after a successful report. */
export function createReportDoneIcon(): SVGSVGElement {
  return makeSvg([REPORT_DONE_PATH], {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  });
}
