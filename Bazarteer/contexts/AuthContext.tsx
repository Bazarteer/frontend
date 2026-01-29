import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
    jwt: string; 
    username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (name: string, surname: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth mora biti uporabljen znotraj AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Napaka pri preverjanju uporabnika:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try{
        const response = await fetch('http://74.248.81.121/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({username, password})
        });

        if (!response.ok){
            const errorData = await response.json();
            throw new Error(errorData.error || "Napaka pri prijavi1");
        }

        const data = await response.text();
        const userData: User = {
            jwt: data,
            username: username
        };

        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    }   
    catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Napaka pri prijavi2");
    }
  };

  const signup = async (name: string, surname: string, username: string, password: string) => {
    try{
        const response = await fetch('http://74.248.81.121/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({name, surname, username, password})
        });

        if (!response.ok){
            const errorData = await response.json();
            throw new Error(errorData.error || "Napaka pri registraciji");
        }

        const data = await response.text();
        const userData: User = {
            jwt: data,
            username: username
        };

        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    }   
    catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Napaka pri registraciji");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};