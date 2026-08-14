import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const SidebarContext = createContext({
    collapsed: false,
    toggleCollapse: () => { },
});
export function SidebarProvider({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    useEffect(() => {
        localStorage.removeItem('sidebarCollapsed');
        setCollapsed(false);
    }, []);
    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebarCollapsed', String(next));
    };
    return (_jsx(SidebarContext.Provider, { value: { collapsed, toggleCollapse }, children: children }));
}
export function useSidebar() {
    return useContext(SidebarContext);
}
