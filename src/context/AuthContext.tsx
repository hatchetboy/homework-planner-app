import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import type { TokenResponse } from '@react-oauth/google';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { firebaseAuth, firebaseEnabled } from '../lib/firebase';

interface User {
    id: string;
    name: string;
    email: string;
    picture: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    login: () => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse: TokenResponse) => {
            setIsLoading(true);
            setAccessToken(tokenResponse.access_token);

            try {
                const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                }).then(res => res.json());

                setUser({
                    id: userInfo.sub,
                    name: userInfo.name,
                    email: userInfo.email,
                    picture: userInfo.picture,
                });

                // Sign into Firebase silently using the Google OAuth token
                if (firebaseEnabled && firebaseAuth) {
                    const credential = GoogleAuthProvider.credential(null, tokenResponse.access_token);
                    await signInWithCredential(firebaseAuth, credential).catch(err =>
                        console.warn('Firebase sign-in failed:', err)
                    );
                }
            } catch (error) {
                console.error("Failed to fetch user info", error);
            } finally {
                setIsLoading(false);
            }
        },
        onError: error => console.error('Login Failed:', error),
        scope: 'https://www.googleapis.com/auth/calendar.events'
    });

    const logout = () => {
        googleLogout();
        if (firebaseEnabled && firebaseAuth) {
            signOut(firebaseAuth).catch(() => {});
        }
        setUser(null);
        setAccessToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
