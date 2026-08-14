import { jsx as _jsx } from "react/jsx-runtime";
import { Toaster as Sonner, toast } from "sonner";
import { useAutoTheme } from "@/hooks/useAutoTheme";
const Toaster = ({ ...props }) => {
    const { isDark } = useAutoTheme();
    return (_jsx(Sonner, { theme: isDark ? "dark" : "light", className: "toaster group", toastOptions: {
            classNames: {
                toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                description: "group-[.toast]:text-muted-foreground",
                actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            },
        }, ...props }));
};
export { Toaster, toast };
