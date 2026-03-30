import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import HeaderSearch from "@/Components/HeaderSearch";
import AppsCardList from "@/Components/AppsCardList";
import AppsList from "@/Components/AppsList";

export default function Dashboard({ apps = [], divisions = [] }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="pb-3">
                <HeaderSearch apps={apps} />
            </div>
            <div className="py-4 px-8">
                <AppsCardList apps={apps} />
            </div>
            <div className="py-4 px-4">
                <AppsList apps={apps} divisions={divisions} />
            </div>
        </AuthenticatedLayout>
    );
}
