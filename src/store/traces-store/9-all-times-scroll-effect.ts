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
        const unsubscribe = subscribeKey(allTimesStore, 'allTimesSelectedTimestamp', (timestamp) => {
            if (!timestamp) return;

            const viewport = get(allTimesPanelRefAtom);
            if (!viewport) return;

            // Find the element with matching data-timestamp
            const element = viewport.querySelector(`[data-timestamp="${timestamp}"]`) as HTMLElement;
            if (!element) return;

            // Calculate element position relative to the viewport's scroll container
            const elementTop = element.offsetTop;
            const elementBottom = elementTop + element.offsetHeight;
            const viewportScrollTop = viewport.scrollTop;
            const viewportHeight = viewport.clientHeight;
            const viewportScrollBottom = viewportScrollTop + viewportHeight;

            // Check if element is visible
            const isVisible = elementTop >= viewportScrollTop && elementBottom <= viewportScrollBottom;

            // Only scroll if not visible - center the element
            if (!isVisible) {
                const targetScrollTop = elementTop - (viewportHeight / 2) + (element.offsetHeight / 2);
                viewport.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
            }
        });

        return () => unsubscribe();
    }
);
