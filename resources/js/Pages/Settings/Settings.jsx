import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import IndexUsermanagement from "./UserManagement/index";

const HomeIcon = ({
    className = "w-5 h-5"
}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>;

const UserIcon = ({
    className = "w-5 h-5"
}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>;

const SettingsIcon = ({
    className = "w-5 h-5"
}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>;

const MailIcon = ({
    className = "w-5 h-5"
}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>;

const spanVariants = {
    initial: {
        width: 0,
        opacity: 0
    },
    animate: {
        width: "auto",
        opacity: 1,
        transition: {
            delay: 0.05,
            duration: 0.2,
            ease: "easeOut"
        }
    },
    exit: {
        width: 0,
        opacity: 0,
        transition: {
            duration: 0.1,
            ease: "easeIn"
        }
    }
};

function ExpandedTabs({ tabs, className, onChange }) {
    const [selected, setSelected] = useState(0);
    const containerRef = useRef(null);
    const handleSelect = index => {
        setSelected(index);
        if (onChange) onChange(index);
    };
    const SeparatorComponent = () => <div className="h-7 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />;
    return <div ref={containerRef} className={`flex items-center gap-1 rounded-xl border border-slate-200 bg-white/70 dark:bg-black dark:border-slate-700 p-1 shadow-md backdrop-blur-sm ${className || ""}`}>
        {tabs.map((tab, index) => {
            if (tab.type === "separator") {
                return <SeparatorComponent key={index} />;
            }
            const Icon = tab.icon;
            const isSelected = selected === index;
            return <button key={tab.title} onClick={() => handleSelect(index)} className={`relative z-10 flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none
            ${isSelected ? "text-slate-900 dark:text-green-300" : "text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100"}`}>
                {isSelected && <motion.div layoutId="pill" className="absolute inset-0 z-0 rounded-lg bg-white dark:bg-green-500/20 backdrop-blur-sm border border-green-400/30 shadow-sm" transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 40
                }} />}
                <span className="relative z-10 flex items-center gap-2">
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <AnimatePresence initial={false}>
                        {isSelected && <motion.span variants={spanVariants} initial="initial" animate="animate" exit="exit" className="overflow-hidden whitespace-nowrap">
                            {tab.title}
                        </motion.span>}
                    </AnimatePresence>
                </span>
            </button>;
        }
        )}
    </div>
}

export default function Settings({ users, roles, divisions }) {
    const [activeTab, setActiveTab] = useState(0);

    const TABS = [{
        title: "Home",
        icon: HomeIcon
    }, {
        type: "separator"
    },{
        title: "Users",
        icon: UserIcon
    }, {
        title: "Messages",
        icon: MailIcon
    }, {
        type: "separator"
    }, {
        title: "Settings",
        icon: SettingsIcon
    }];

    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return <h1>Hello, Im in Home Settings</h1>;
            case 2:
                return <IndexUsermanagement users={users} roles={roles} divisions={divisions} />;
            case 3:
                return <h1>Hello, Im in Messages Settings</h1>;
            case 5:
                return <h1>Hello, Im in App Settings</h1>;
            default:
                return <h1>Select a tab</h1>;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Settings
                </h2>
            }
        >
            <Head title="Settings" />
            <div className="mx-4 px-4 py-4 sm:mx-6 lg:mx-8">
                <div className="justify-items-center">
                    <div className="max-w-xs">
                        <ExpandedTabs tabs={TABS} className="mb-4" onChange={setActiveTab} />
                    </div>
                </div>
                <div className="bg-white my-4 px-4 py-4 rounded-lg">
                    {renderTabContent()}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
