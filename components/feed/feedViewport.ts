/** Pixel slack for sub-pixel / safe-area when checking full visibility in the viewport. */
export const FEED_VIEWPORT_EDGE_EPS = 2;

/** True when the element’s bounding box lies fully inside the visual viewport (feed cards, mini-feed). */
export function isFeedElementFullyVisible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  const vv = window.visualViewport;
  const vh = vv?.height ?? window.innerHeight;
  const vw = vv?.width ?? window.innerWidth;
  const top = vv?.offsetTop ?? 0;
  const left = vv?.offsetLeft ?? 0;
  const eps = FEED_VIEWPORT_EDGE_EPS;
  return (
    r.top >= top - eps &&
    r.left >= left - eps &&
    r.bottom <= top + vh + eps &&
    r.right <= left + vw + eps
  );
}
