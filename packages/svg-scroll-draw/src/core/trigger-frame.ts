/**
 * Measure the element a trigger window is computed from, in the coordinate space
 * `computeTriggers` expects — which is not the same space in both cases.
 *
 * Scrolling the window: `getBoundingClientRect()` is viewport-relative, so the
 * scroll position has to be added back to reach a document position, and
 * `elementAnchorY` does exactly that.
 *
 * Scrolling a container: the offset inside the scroll content is
 * `rect.top - containerRect.top + container.scrollTop`, which **already includes**
 * the scroll position. Handing that to `elementAnchorY` with the live scroll
 * position counted it twice, so any re-measure while scrolled moved the trigger
 * window by however far the user had scrolled. At scrollTop 0 the two agree, which
 * is why it survived: the first measurement happens at construction, and only a
 * later resize or `refresh()` exposes it. Measured: a `scrollHorizontal` strip
 * scrubbed halfway snapped back to its first panel on a resize, without the user
 * scrolling at all.
 *
 * The returned `scroll` is what to pass as `computeTriggers`' scroll argument —
 * the live position for the window, zero for a container, where it is already
 * baked in. Three engines each had their own copy of this arithmetic, and
 * therefore three copies of the same defect.
 *
 * Its own file because only those engines need it; ./trigger is shared more widely.
 */
export function measureTriggerFrame(
  el: Element,
  scrollEl: Element | null,
  axis: 'x' | 'y'
): { top: number; height: number; scroll: number } {
  const rect = el.getBoundingClientRect();
  const size = axis === 'x' ? rect.width : rect.height;

  if (scrollEl) {
    // From the scrollport, inside the border, as clientHeight and CSS view()
    // measure it. From the border box, a 20px border moved the window 20px.
    const top =
      axis === 'x'
        ? rect.left - scrollEl.getBoundingClientRect().left - scrollEl.clientLeft + scrollEl.scrollLeft
        : rect.top - scrollEl.getBoundingClientRect().top - scrollEl.clientTop + scrollEl.scrollTop;
    return { top, height: size, scroll: 0 };
  }

  return {
    top: axis === 'x' ? rect.left : rect.top,
    height: size,
    scroll: axis === 'x' ? window.scrollX : window.scrollY,
  };
}
