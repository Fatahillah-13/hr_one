import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import Icon from '@/Components/hr/Icon';
import { PageHero, Panel, Pill, initials } from '@/Components/hr/ui';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth.user;
    return (
        <AuthenticatedLayout>
            <Head title="Profile" />
            <PageHero icon="user" title="Profile" subtitle="Data akun HR One Anda." crumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Profile' }]} />
            <div className="mx-auto grid max-w-[1240px] items-start gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)]">
                <Panel className="grid justify-items-center gap-1.5 py-7 text-center lg:sticky lg:top-24">
                    <span className="hx-pop mb-1.5 grid h-[84px] w-[84px] place-items-center rounded-[26px] bg-gradient-to-br from-[#5B7BFF] to-[#2F4BD8] text-[28px] font-extrabold text-white shadow-[0_18px_30px_-16px_rgba(47,75,216,.9)]">{initials(user.name)}</span>
                    <h2 className="text-lg font-extrabold text-[#27272E]">{user.name}</h2>
                    {user.username && <p className="font-mono text-[12.5px] text-slate-500">@{user.username}</p>}
                    <div className="mt-1 flex flex-wrap justify-center gap-1.5"><Pill tone="blue">{auth.isAdmin ? 'Admin' : 'User'}</Pill></div>
                    {user.email && <div className="mt-2.5 flex items-center gap-2 break-all text-[13px] text-[#425466]"><Icon name="mail" className="h-4 w-4 shrink-0 text-slate-400" />{user.email}</div>}
                </Panel>
                <div className="grid min-w-0 gap-5">
                    <Panel><UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} /></Panel>
                    <Panel className="[animation-delay:.06s]"><UpdatePasswordForm /></Panel>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
