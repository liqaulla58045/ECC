import { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('ecc_user_profile');
        return savedUser ? JSON.parse(savedUser) : {
            name: "Rajesh Kumar",
            role: "Chairman",
            email: "chairman@startupvarsity.com",
            bio: "Chairman & Strategic Advisor for StartupVarsity, overseeing innovation and cohort excellence.",
            avatar: null
        };
    });

    const updateUser = (newData) => {
        setUser(prev => {
            const updated = { ...prev, ...newData };
            localStorage.setItem('ecc_user_profile', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <UserContext.Provider value={{ user, updateUser }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
