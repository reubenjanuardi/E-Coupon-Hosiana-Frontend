import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: { username: string; role?: string } | null;
    login: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<{ username: string; role?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // validateStatus: allow 401 to pass without throwing an exception
                const response = await api.get("/auth/me", {
                    validateStatus: (status) => status === 200 || status === 401
                });

                if (response.status === 200) {
                    setIsAuthenticated(true);
                    setUser(response.data.user);
                } else {
                    // 401 or others
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (error) {
                // Network errors (server down, etc)
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (credentials: any) => {
        const { data } = await api.post("/auth/login", credentials);
        setIsAuthenticated(true);
        setUser(data.user);
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setIsAuthenticated(false);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
