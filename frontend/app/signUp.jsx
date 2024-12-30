import { Alert, Pressable, StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
import Toast from 'react-native-toast-message';
import axios from 'axios';
import Lock from '../assets/icons/Lock';

const SignUp = () => {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); // Xác nhận mật khẩu
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State để kiểm soát hiển thị mật khẩu
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false); // State cho confirm password

    const showPassword = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const showConfirmPassword = () => {
        setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
    };

    const onSubmit = async () => {
        if (!username.trim() || !email.trim() || !password.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Sign Up Error',
                text2: 'Please fill all the fields!'
            });
            return;
        }
    
        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Sign Up Error',
                text2: 'Passwords do not match!'
            });
            return;
        }
    
        setLoading(true);
    
        try {
            const response = await axios.post('http://localhost:5000/api/signup', {
                username: username.trim(),
                email: email.trim(),
                password: password.trim()
            });
    
            setLoading(false);
    
            if (response.data.success) {
                Toast.show({
                    type: 'success',
                    text1: 'Đăng ký thành công!',
                    text2: 'Account của bạn đã được tạo!'
                });
                router.push('/login');
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Sign Up Error',
                    text2: response.data.msg
                });
            }
        } catch (error) {
            setLoading(false);
            Toast.show({
                type: 'error',
                text1: 'Sign Up Error',
                text2: error.message
            });
        }
    };

    return (
        <ScreenWrapper bg="white">
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    <View style={styles.container}>
                        <BackButton router={router} />
                        {/* Welcome Section */}
                        <View>
                            <Text style={styles.welcomeText}>Hello,</Text>
                            <Text style={styles.welcomeText}>Create an Account</Text>
                        </View>
                        {/* Form Section */}
                        <View style={styles.form}>
                            <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
                                Please fill the details to sign up
                            </Text>
                            <Input
                                icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                                placeholder="Enter your username"
                                value={username}
                                onChangeText={setUsername}
                            />
                            <Input
                                icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                            />
                            <Input
                                icon={
                                    <Lock
                                        onPress={showPassword} // Thay đổi trạng thái khi nhấn
                                        name={isPasswordVisible ? "visibility" : "visibility-off"} // Biểu tượng thay đổi tùy theo trạng thái
                                        size={26} 
                                        strokeWidth={1.6} 
                                    />
                                }
                                placeholder="Enter your password"
                                secureTextEntry={!isPasswordVisible}  // Hiển thị/ẩn mật khẩu dựa trên trạng thái
                                value={password}
                                onChangeText={setPassword}
                            />
                            <Input
                                icon={
                                    <Lock
                                        onPress={showConfirmPassword} // Thay đổi trạng thái khi nhấn
                                        name={isConfirmPasswordVisible ? "visibility" : "visibility-off"} // Biểu tượng thay đổi tùy theo trạng thái
                                        size={26} 
                                        strokeWidth={1.6} 
                                    />
                                }
                                placeholder="Confirm your password"
                                secureTextEntry={!isConfirmPasswordVisible}  // Hiển thị/ẩn mật khẩu dựa trên trạng thái
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            <Button title={loading ? "Signing up..." : "Sign Up"} loading={loading} onPress={onSubmit} disabled={loading} />
                        </View>
                        {/* Footer Section */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <Pressable onPress={() => router.push('login')}>
                                <Text style={[styles.footerText, { color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold }]}>
                                    Login
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

export default SignUp;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 45,
        paddingHorizontal: wp(5)
    },
    welcomeText: {
        fontSize: hp(4),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text
    },
    form: {
        gap: 25
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    },
    footerText: {
        textAlign: 'center',
        color: theme.colors.text,
        fontSize: hp(1.6)
    }
});
