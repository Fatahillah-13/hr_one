import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import HeaderSearch from "@/Components/HeaderSearch";
import AppsCardList from "@/Components/AppsCardList";
import AppsList from "@/Components/AppsList";

export default function Dashboard({ apps = [], divisions = [], recentApps = [] }) {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <HeaderSearch apps={apps} divisions={divisions} />
            <div className="relative z-[3] mx-auto grid max-w-[1240px] gap-6 px-4 pb-10 pt-1 sm:px-6">
                {recentApps.length > 0 && <AppsCardList apps={recentApps} />}
                <AppsList apps={apps} divisions={divisions} />
            </div>
        </AuthenticatedLayout>
    );
}
