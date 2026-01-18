import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { subscribeKey } from "valtio/utils";
import { allTimesStore } from "./3-all-times-store";

/**
 * Atom to store the AllTimesPanel scroll container element.
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

            const container = get(allTimesPanelRefAtom);
            if (!container) return;

            // Find the element with matching data-timestamp
            const element = container.querySelector(`[data-timestamp="${timestamp}"]`) as HTMLElement;
            if (!element) return;

            // Check if element is visible in the viewport
            const viewport = container.closest('[data-radix-scroll-area-viewport]') as HTMLElement || container;
            const elementRect = element.getBoundingClientRect();
            const viewportRect = viewport.getBoundingClientRect();

            const isVisible = (
                elementRect.top >= viewportRect.top &&
                elementRect.bottom <= viewportRect.bottom
            );

            // Only scroll if not visible
            if (!isVisible) {
                element.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        });

        return () => unsubscribe();
    }
);
