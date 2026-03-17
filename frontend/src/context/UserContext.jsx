import { createContext, useState, useContext } from 'react';
import { saveToken, clearToken } from '../utils/api';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('ecc_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const login = (token, userData) => {
        saveToken(token);
        localStorage.setItem('ecc_user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        clearToken();
        setUser(null);
    };

    const updateUser = (newData) => {
        setUser(prev => {
            const updated = { ...prev, ...newData };
            localStorage.setItem('ecc_user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <UserContext.Provider value={{ user, login, logout, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};
