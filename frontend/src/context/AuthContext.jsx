import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem("safevic_user");
        const savedToken = localStorage.getItem("safevic_token");

        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
        }

        setAuthLoading(false);
    }, []);

    const login = (userData, tokenData) => {
        setUser(userData);
        setToken(tokenData);
        localStorage.setItem("safevic_user", JSON.stringify(userData));
        localStorage.setItem("safevic_token", tokenData);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("safevic_user");
        localStorage.removeItem("safevic_token");
    };

    return (
        <AuthContext.Provider
            value={{ user, token, login, logout, authLoading }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}