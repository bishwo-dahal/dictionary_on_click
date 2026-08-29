export interface BubbleAnchor {
  x: number;
  y: number;
}

export type SelectionVisibility = "none" | "offscreen" | "visible";

export function rectIntersectsViewport(
  rect: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  },
  viewport: { width: number; height: number } = {
    width: window.innerWidth,
    height: window.innerHeight,
  },
): boolean {
  return (
    rect.bottom > 0 &&
    rect.top < viewport.height &&
    rect.right > 0 &&
    rect.left < viewport.width
  );
}

export function getSelectionVisibility(): SelectionVisibility {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    return "none";
  }

  const text = sel.toString().trim();
  if (!text) {
    return "none";
  }

  const rect = sel.getRangeAt(0).getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return "none";
  }

  if (!rectIntersectsViewport(rect)) {
    return "offscreen";
  }

  return "visible";
}

export function anchorFromSelectionRange(): BubbleAnchor | null {
  if (getSelectionVisibility() !== "visible") {
    return null;
  }

  const rect = window.getSelection()!.getRangeAt(0).getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.bottom,
  };
}
