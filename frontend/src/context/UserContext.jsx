import { createContext, useState, useContext } from 'react';

const UserContext = createContext();

const DEFAULT_USER = {
    name: '',
    role: 'Administrator',
    email: '',
    bio: '',
    avatar: null,
    phone: '',
    jobTitle: '',
    department: '',
    location: '',
    website: '',
    linkedin: '',
    username: '',
    dateOfBirth: '',
    country: '',
    organization: ''
};

export function UserProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('ecc_user_profile');
            return saved ? { ...DEFAULT_USER, ...JSON.parse(saved) } : DEFAULT_USER;
        } catch {
            return DEFAULT_USER;
        }
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
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};
