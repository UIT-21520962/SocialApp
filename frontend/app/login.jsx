import { Alert, Pressable, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import Icon from '../assets/icons';
import { theme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';
import BackButton from '../components/BackButton';
import { useRouter } from 'expo-router';
import { hp, wp } from '../helpers/common';
import Input from '../components/Input';
import Button from '../components/Button';
import axios from 'axios';
import Toast from 'react-native-toast-message'; // Import thư viện Toast

const Login = () => {
    const router = useRouter();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async () => {
        // Kiểm tra nếu người dùng chưa nhập thông tin
        if (!email.trim() || !password.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Please fill in both email and password fields!',
            });
            return;
        }
        
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/login', {
                email: email.trim(),
                password: password.trim()
            });

            setLoading(false);

            if (response.data.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Login Successful!',
                });
                router.push('/home');
            } else {
                Toast.show({
                    type: 'error',
                    text1: `Error: ${response.data.msg}`,
                });
            }
        } catch (error) {
            setLoading(false);
            Toast.show({
                type: 'error',
                text1: `Error: ${error.response ? error.response.data.msg : error.message}`,
            });
        }
    };

    return (
        <ScreenWrapper bg="white">
            <StatusBar style="dark" />
            <View style={styles.container}>
                <BackButton router={router} />

                <View>
                    <Text style={styles.welcomeText}>Hey,</Text>
                    <Text style={styles.welcomeText}>Welcome Back!</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.subTitle}>Please login to continue</Text>
                    <Input
                        icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <Input
                        icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                        placeholder="Enter your password"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
                        <Text style={styles.showPassword}>
                            {showPassword ? 'Hide Password' : 'Show Password'}
                        </Text>
                    </TouchableOpacity>

                    <Button title={loading ? "Logging in..." : "Login"} loading={loading} onPress={onSubmit} disabled={loading} style={styles.loginButton} />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <Pressable onPress={() => router.push('signUp')}>
                        <Text style={styles.footerTextLink}>Sign up</Text>
                    </Pressable>
                </View>
            </View>
        </ScreenWrapper>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: wp(5),
        gap: 45,
    },
    welcomeText: {
        fontSize: hp(4),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: hp(1),
    },
    subTitle: {
        fontSize: hp(1.5),
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: hp(2),
    },
    form: {
        gap: 20,
    },
    showPassword: {
        textAlign: 'right',
        fontSize: hp(1.5),
        color: theme.colors.primaryDark,
        fontWeight: theme.fonts.semibold,
    },
    loginButton: {
        backgroundColor: theme.colors.primaryDark,
        borderRadius: 25,
        paddingVertical: 15,
        elevation: 3,
        marginTop: hp(2),
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    footerText: {
        textAlign: 'center',
        color: theme.colors.text,
        fontSize: hp(1.6),
    },
    footerTextLink: {
        color: theme.colors.primaryDark,
        fontSize: hp(1.6),
        fontWeight: theme.fonts.semibold,
    },
});
