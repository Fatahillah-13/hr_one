import MagicContainer from "./ui/magic-card";
import React from "react";

export default function AppCards({ children, className }) {
    return (
        <MagicContainer className={className}>
            <div className="rounded-3xl bg-white/10 p-6">{children}</div>
        </MagicContainer>
    );
}
