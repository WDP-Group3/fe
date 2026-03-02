import { createContext, useContext } from 'react';

// Create the context
export const AuthContext = createContext(null);

// Create the hook to use the context
export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within AuthProvider');
    }
    return context;
};
