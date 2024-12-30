import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import Avatar from './Avatar';
import moment from 'moment';
import Icon from '../assets/icons';
import RenderHTML from 'react-native-render-html';
import { Video } from 'expo-av';
import Loading from './Loading';

const PostCard = ({ item, currentUser, router, showDelete = false, onDelete = () => {}, onEdit = () => {} }) => {
    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLikes(item?.postLikes || []);
    }, [item]);

    const openPostDetails = () => {
        router.push({ pathname: 'postDetails', params: { postId: item?.id } });
    };

    const onLike = async () => {
        try {
            setLoading(true);
            // Assuming you have a backend endpoint to like/unlike a post
            const response = await fetch(`http://localhost:5000/api/posts/${item.id}/like`, {
                method: likes.some(like => like.userId === currentUser?.id) ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`, // send the user token
                },
            });
            const data = await response.json();
            if (data.success) {
                setLikes(prevLikes => 
                    likes.some(like => like.userId === currentUser.id)
                        ? prevLikes.filter(like => like.userId !== currentUser.id)
                        : [...prevLikes, { userId: currentUser.id }]
                );
            }
            setLoading(false);
        } catch (error) {
            console.error("Error liking post:", error);
            setLoading(false);
        }
    };

    const handlePostDelete = () => {
        Alert.alert('Confirm', "Are you sure you want to delete this post?", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', onPress: () => onDelete(item), style: 'destructive' }
        ]);
    };

    const createdAt = moment(item?.created_at).format('MMM D');
    const liked = likes.some(like => like.userId === currentUser?.id);

    return (
        <View style={styles.container}>
            {/* Header with user info and post time */}
            <View style={styles.header}>
                <Avatar size={hp(4.5)} uri={item?.user?.image} />
                <View>
                    <Text style={styles.username}>{item?.user?.name}</Text>
                    <Text style={styles.postTime}>{createdAt}</Text>
                </View>
                {showDelete && currentUser.id === item?.userId && (
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => onEdit(item)}>
                            <Icon name="edit" size={hp(2.5)} color={theme.colors.text} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handlePostDelete}>
                            <Icon name="delete" size={hp(2.5)} color={theme.colors.rose} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Post body */}
            {item?.body && (
                <RenderHTML contentWidth={wp(100)} source={{ html: item?.body }} />
            )}

            {/* Media (image/video) */}
            {item?.file && item?.file.includes('postImages') && (
                <Image source={{ uri: `http://localhost:5000/api/files/${item?.file}` }} style={styles.postMedia} />
            )}
            {item?.file && item?.file.includes('postVideos') && (
                <Video source={{ uri: `http://localhost:5000/api/files/${item?.file}` }} useNativeControls style={styles.postMedia} />
            )}

            {/* Footer with like, comment, and share */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={onLike} disabled={loading}>
                    <Icon name="heart" size={24} fill={liked ? theme.colors.rose : 'transparent'} />
                </TouchableOpacity>
                <Text style={styles.count}>{likes.length}</Text>
            </View>

            {/* Loading indicator for like action */}
            {loading && <Loading />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: wp(4),
        backgroundColor: theme.colors.white,
        marginBottom: hp(2),
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp(2),
    },
    username: {
        fontSize: hp(2),
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    postTime: {
        fontSize: hp(1.5),
        color: theme.colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    postMedia: {
        width: wp(100),
        height: hp(30),
        marginVertical: hp(2),
        borderRadius: 10,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    count: {
        marginLeft: wp(2),
        fontSize: hp(2),
        color: theme.colors.text,
    },
});

export default PostCard;
