import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import HeaderSearch from "@/Components/HeaderSearch";
import AppsCardList from "@/Components/AppsCardList";

export default function Dashboard() {
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
                <HeaderSearch />
            </div>
            <div className="py-3 px-8">
                <AppsCardList />
            </div>

        </AuthenticatedLayout>
    );
}
