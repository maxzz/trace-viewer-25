import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { isZipProcessingAtom } from '../../store/2-ui-atoms';
import { Spinner } from './icons/animated/wait-v1/1-wait-v1';

export function ZipLoadingOverlay() {
    const [isProcessing] = useAtom(isZipProcessingAtom);
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        let timeoutId: number;

        if (isProcessing) {
            // Wait 2 seconds before showing the overlay
            timeoutId = window.setTimeout(() => {
                setShowOverlay(true);
            }, 2000);
        } else {
            setShowOverlay(false);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [isProcessing]);

    if (!showOverlay) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-4">
                <Spinner blockClasses="bg-primary" className="h-12 w-12" />
                <p className="text-lg font-medium text-foreground">Processing ZIP file...</p>
            </div>
        </div>
    );
}
