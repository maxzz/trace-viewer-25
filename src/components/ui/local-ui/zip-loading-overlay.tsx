import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { isZipProcessingAtom } from '@/store/2-ui-atoms';
import { Spinner } from '../icons/animated/wait-v1';

export function ZipLoadingOverlay() {
    const [isProcessing] = useAtom(isZipProcessingAtom);
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        let timeoutId: number;

        if (isProcessing) {
            // Wait 2 seconds before showing the overlay
            timeoutId = setTimeout(() => setShowOverlay(true), 2000);
        } else {
            setShowOverlay(false);
        }

        return () => {
            timeoutId && clearTimeout(timeoutId);
        };
    }, [isProcessing]);

    if (!showOverlay) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
                <Spinner className="size-12" blockClasses="bg-primary" />

                <p className="text-lg font-medium text-foreground">
                    Processing ZIP file...
                </p>
            </div>
        </div>
    );
}
