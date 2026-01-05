import { useEffect } from "react";
import { useSnapshot } from "valtio";
import { appMainTitle, defaultTitle } from "@/store/ui-atoms";

export function WindowsAppTitleCaption() {
    const { title } = useSnapshot(appMainTitle);

    useEffect(
        () => {
            document.title = title ? `${title} - ${defaultTitle}` : defaultTitle;
        }, [title]
    );

    return null;
}
