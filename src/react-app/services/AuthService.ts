import { CONFIG } from '../config';

export interface User {
    id: string;
    username: string;
    role: 'admin' | 'staff';
    name: string;
    branch?: string;
}

class AuthService {
    private USER_KEY = 'user';
    private API_URL = `${CONFIG.API_BASE_URL}/auth`;

    async login(username: string, password: string): Promise<User | null> {
        try {
            const response = await fetch(`${this.API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Login failed:', errorData.error);
                return null;
            }

            const user: User = await response.json();
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            return user;
        } catch (error) {
            console.error('Login error:', error);
            return null;
        }
    }

    logout() {
        localStorage.removeItem(this.USER_KEY);
        // We use window.location.reload() or navigate in the component, 
        // but here we just clear storage.
        // If we want to force redirect:
        window.location.href = '/login';
    }

    getCurrentUser(): User | null {
        try {
            const userStr = localStorage.getItem(this.USER_KEY);
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    }

    isAuthenticated(): boolean {
        return !!this.getCurrentUser();
    }

    isAdmin(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'admin';
    }
}

export const authService = new AuthService();
