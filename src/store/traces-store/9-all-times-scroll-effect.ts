import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { subscribeKey } from "valtio/utils";
import { allTimesStore } from "./3-all-times-store";

/**
 * Atom to store the AllTimesPanel scroll viewport element.
 * Set this from the AllTimesPanel component on mount.
 */
export const allTimesPanelRefAtom = atom<HTMLElement | null>(null);

/**
 * Effect atom that watches allTimesSelectedTimestamp and scrolls to the selected item
 * in the AllTimesPanel if it's not visible.
 */
export const allTimesScrollEffectAtom = atomEffect(
    (get) => {
        // Get viewport - this creates a dependency, so effect re-runs when viewport changes
        const viewport = get(allTimesPanelRefAtom);
        console.log('[allTimesScrollEffect] Effect run, viewport:', viewport ? 'element' : 'null');

        // Subscribe to timestamp changes
        const unsubscribe = subscribeKey(allTimesStore, 'allTimesSelectedTimestamp', (timestamp) => {
            console.log('[allTimesScrollEffect] subscribeKey callback, timestamp:', timestamp, 'viewport in closure:', viewport ? 'element' : 'null');
            // Use requestAnimationFrame to ensure layout is ready
            requestAnimationFrame(() => {
                scrollToTimestampIfNeeded(viewport, timestamp);
            });
        });

        // Also scroll immediately if viewport just became available and there's a selected timestamp
        const currentTimestamp = allTimesStore.allTimesSelectedTimestamp;
        console.log('[allTimesScrollEffect] Initial check - viewport:', viewport ? 'element' : 'null', 'timestamp:', currentTimestamp);
        
        if (viewport && currentTimestamp) {
            console.log('[allTimesScrollEffect] Initial check PASSED, scheduling scroll');
            requestAnimationFrame(() => {
                scrollToTimestampIfNeeded(viewport, currentTimestamp);
            });
        }

        return () => {
            console.log('[allTimesScrollEffect] Cleanup');
            unsubscribe();
        };
    }
);

/**
 * Scrolls to an element in the viewport if it's not visible.
 * Uses getBoundingClientRect for robust position calculation regardless of DOM structure.
 */
function scrollToTimestampIfNeeded(viewport: HTMLElement | null, timestamp: string | null) {
    console.log('scrollToTimestampIfNeeded', timestamp, viewport);

    if (!timestamp || !viewport) return;

    // Find the element with matching data-timestamp
    const element = viewport.querySelector(`[data-timestamp="${timestamp}"]`) as HTMLElement;
    if (!element) return;

    // Use getBoundingClientRect for robust calculation
    const elementRect = element.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();

    // Check if element is fully visible within viewport
    const isVisible = (
        elementRect.top >= viewportRect.top &&
        elementRect.bottom <= viewportRect.bottom
    );

    console.log('elementRect', elementRect, 'viewportRect', viewportRect, 'isVisible', isVisible);

    // Only scroll if not visible - center the element
    if (!isVisible) {
        // Calculate how much to scroll to center the element
        const relativeTop = elementRect.top - viewportRect.top;
        const currentScrollTop = viewport.scrollTop;
        const delta = relativeTop - (viewport.clientHeight / 2) + (element.offsetHeight / 2);

        viewport.scrollTo({
            top: currentScrollTop + delta,
            behavior: 'smooth'
        });
    }
}
