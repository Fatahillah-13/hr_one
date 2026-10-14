import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

/** true selama Inertia sedang memuat halaman (filter, paging, dsb). */
export default function useInertiaLoading(delay = 120) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let timer;
        const offStart = router.on("start", () => {
            timer = setTimeout(() => setLoading(true), delay);
        });
        const offFinish = router.on("finish", () => {
            clearTimeout(timer);
            setLoading(false);
        });
        return () => {
            clearTimeout(timer);
            offStart();
            offFinish();
        };
    }, [delay]);

    return loading;
}
