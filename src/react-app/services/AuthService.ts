
export interface User {
    id: string;
    username: string;
    role: 'admin' | 'staff';
    name: string;
}

class AuthService {
    private USER_KEY = 'user';

    login(username: string, password: string): User | null {
        // Hardcoded credentials for MVP
        if (username === 'VKINFOTECH' && password === 'VKINFOTECH123') {
            const user: User = { id: '1', username: 'VKINFOTECH', role: 'admin', name: 'Administrator' };
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            return user;
        }
        if (username === 'VK INFOTECHSTAFF' && password === 'VKINFOTECHSTAFF123') {
            const user: User = { id: '2', username: 'VK INFOTECHSTAFF', role: 'staff', name: 'Staff Member' };
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            return user;
        }
        return null;
    }

    logout() {
        localStorage.removeItem(this.USER_KEY);
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
