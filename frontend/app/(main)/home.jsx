import { Alert, Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Import AuthContext
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';
import { useRouter } from 'expo-router';
import Avatar from '../../components/Avatar';
import Loading from '../../components/Loading';
import PostCard from '../../components/PostCard'; // Ensure PostCard is imported correctly

// API call to fetch posts
const fetchPosts = async (limit, token) => {
    try {
        const response = await fetch(`http://localhost:5000/api/posts?limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`, // Send token in header
            },
        });

        const data = await response.json();
        return data.success ? { success: true, data: data.data } : { success: false, msg: data.msg };
    } catch (error) {
        console.error('Error fetching posts:', error);
        return { success: false, msg: 'Failed to fetch posts' };
    }
};

let limit = 0;

const Home = () => {
    const { user, token, logout, setUser } = useAuth(); // Get user, token and setUser from AuthContext
    const router = useRouter();

    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);
    const [loading, setLoading] = useState(false); // Declare loading state

    // Fetch posts when scroll reaches bottom
    const getPosts = useCallback(async () => {
        if (!hasMore || loading) return; // Stop if no more posts or loading is in progress

        setLoading(true); // Start loading
        limit += 10; // Increase limit for next batch of posts
        
        try {
            if (user && token) {
                // Ensure user is logged in and has token
                const res = await fetchPosts(limit, token);
                if (res.success) {
                    if (res.data.length < 10) {
                        setHasMore(false); // No more posts
                    }

                    setPosts(prevPosts => [...prevPosts, ...res.data]);
                } else {
                    console.error('Error fetching posts:', res.msg); // Log error if fetching posts fails
                }
            } else {
                console.error('User not authenticated');
            }
        } catch (error) {
            console.error('Error in getPosts:', error); // Log error if fetch fails
        } finally {
            setLoading(false); // End loading
        }
    }, [hasMore, user, token, loading]);

    // Logout function
    const onLogout = async () => {
        logout(); // Call logout from AuthContext to clear user data
        Alert.alert('Logged out', "You have successfully logged out!");
    };

    // Fetch user details from database if user exists
    useEffect(() => {
        const fetchUserFromDatabase = async () => {
            if (user && !user.token) {
                // If user doesn't have token, fetch user info from database
                try {
                    const response = await fetch('http://localhost:5000/api/user', {
                        headers: {
                            'Authorization': `Bearer ${token}`, // Send token to authenticate
                        },
                    });

                    const data = await response.json();
                    if (data.success) {
                        setUser(data.user); // Update user context
                    } else {
                        console.error('Failed to fetch user from database:', data.msg);
                    }
                } catch (error) {
                    console.error('Error fetching user from database:', error);
                }
            }
        };

        fetchUserFromDatabase();

        // Fetch initial posts when screen is loaded
        const fetchInitialPosts = async () => {
            const result = await getPosts();
            if (!result.success) {
                console.error('Failed to fetch initial posts:', result.msg);
            }
        };

        if (user) fetchInitialPosts();

        return () => {
            // Cleanup if needed
        };
    }, [user, token, getPosts]); // Run when 'user' or 'token' changes

    if (!user || loading) return <Loading />; // Show loading screen if user is not found or posts are loading

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>LinkUp</Text>
                    <View style={styles.icons}>
                        <Pressable onPress={() => {
                            setNotificationCount(0);
                            router.push('notifications');
                        }}>
                            <Icon name="heart" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
                            {notificationCount > 0 && (
                                <View style={styles.pill}>
                                    <Text style={styles.pillText}>{notificationCount}</Text>
                                </View>
                            )}
                        </Pressable>
                        <Pressable onPress={() => router.push('newPost')}>
                            <Icon name="plus" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
                        </Pressable>
                        <Pressable onPress={() => router.push('profile')}>
                            <Avatar uri={user?.image || 'default-avatar-url'} size={hp(4.3)} rounded={theme.radius.sm} style={{ borderWidth: 2 }} />
                        </Pressable>
                    </View>
                </View>

                {/* Posts */}
                <FlatList
                    data={posts}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listStyle}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => <PostCard item={item} currentUser={user} router={router} />}
                    onEndReached={getPosts} // Fetch more posts when scrolled to the bottom
                    onEndReachedThreshold={0.1} // Start fetching when nearing the end
                    ListFooterComponent={loading ? <Loading /> : null} // Show loading spinner when fetching more posts
                />

                {/* Footer */}
                <Pressable onPress={onLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </Pressable>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: hp(2),
        paddingHorizontal: wp(5),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: hp(2),
    },
    title: {
        fontSize: hp(3.5),
        fontWeight: 'bold',
    },
    icons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pill: {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: theme.colors.primary,
        borderRadius: 50,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    pillText: {
        color: 'white',
        fontSize: hp(1.5),
    },
    listStyle: {
        paddingBottom: hp(2),
    },
    logoutButton: {
        marginTop: hp(2),
        paddingVertical: hp(1),
        backgroundColor: theme.colors.primary,
        borderRadius: 5,
    },
    logoutText: {
        color: 'white',
        textAlign: 'center',
    },
});

export default Home;
