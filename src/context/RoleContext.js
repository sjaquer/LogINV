'use client';
import { createContext, useContext, useState } from 'react';

const ROLES = ['LOGISTICA', 'CHEF', 'ADMIN', 'GERENCIA'];

const ROLE_USERS = {
    LOGISTICA: 'Sebastián (Logística)',
    CHEF: 'Chef Masana',
    ADMIN: 'Admin López',
    GERENCIA: 'Gerente Ramírez',
};

const RoleContext = createContext({
    role: 'LOGISTICA',
    userName: 'Sebastián (Logística)',
    setRole: () => { },
    ROLES,
    ROLE_USERS,
});

export function RoleProvider({ children }) {
    const [role, setRole] = useState('LOGISTICA');
    const userName = ROLE_USERS[role];
    return (
        <RoleContext.Provider value={{ role, setRole, userName, ROLES, ROLE_USERS }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    return useContext(RoleContext);
}
