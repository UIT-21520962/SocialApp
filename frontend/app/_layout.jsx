import { View, Text, LogBox } from 'react-native';
import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import axios from 'axios';

LogBox.ignoreLogs(['Warning: TNodeChildrenRenderer', 'Warning: MemoizedTNodeRenderer', 'Warning: TRenderEngineProvider']);

// Cung cấp AuthContext cho toàn bộ ứng dụng
const _layout = () => {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    );
};

const MainLayout = () => {
    const { setAuth, setUserData } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const checkAuthState = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/auth/session');
                const session = response.data.session;

                if (session) {
                    setAuth(session.user);  // Gọi setAuth để lưu thông tin người dùng vào context
                    updateUserData(session.user, session.user.email);
                    router.replace('/home');
                } else {
                    setAuth(null);
                    router.replace('/welcome');
                }
            } catch (error) {
                console.error('Error checking auth state:', error);
                setAuth(null);
                router.replace('/welcome');
            }
        };

        checkAuthState();
    }, []);

    const updateUserData = async (user, email) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/users/${user?.id}`);
            if (response.data.success) {
                setUserData({ ...response.data.data, email }); // Cập nhật thông tin người dùng
            } else {
                console.error('Failed to fetch user data:', response.data.msg);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    return (
        <Stack
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="(main)/postDetails"
                options={{
                    presentation: 'modal'
                }}
            />
        </Stack>
    );
};

export default _layout;
