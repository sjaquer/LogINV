'use client';
import { createContext, useContext, useState } from 'react';

const ROLES = ['LOGISTICA', 'PLANTA', 'ADMIN', 'GERENCIA'];

const ROLE_USERS = {
    LOGISTICA: 'Jefe Logística Paredes',
    PLANTA: 'Jefe de Planta Rodríguez',
    ADMIN: 'Administrador Quispe',
    GERENCIA: 'Gerente General Mendoza',
};

const RoleContext = createContext({
    role: 'LOGISTICA',
    userName: 'Jefe Logística Paredes',
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
