import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import PostCard from '../../components/PostCard';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/Loading';
import Input from '../../components/Input';
import { TouchableOpacity } from 'react-native';
import Icon from '../../assets/icons';
import CommentItem from '../../components/CommentItem';
import axios from 'axios';

const PostDetails = () => {
    const { postId, commentId } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const inputRef = useRef(null);
    const commentRef = useRef('');

    const [startLoading, setStartLoading] = useState(true);
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleNewComment = async (payload) => {
        if (payload.new) {
            let newComment = { ...payload.new };
            let res = await getUserData(newComment.userId);
            newComment.user = res.success ? res.data : {};
            setPost(prevPost => ({
                ...prevPost,
                comments: [newComment, ...prevPost.comments]
            }));
        }
    };

    useEffect(() => {
        let commentChannel = supabase
            .channel('comments')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}` }, handleNewComment)
            .subscribe();
        getPostDetails();

        return () => {
            supabase.removeChannel(commentChannel);
        };
    }, []);

    const getPostDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/posts/${postId}`);
            if (response.data.success) {
                setPost(response.data.data);
            } else {
                Alert.alert('Error', response.data.msg);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch post details');
        } finally {
            setStartLoading(false);
        }
    };

    const onNewComment = async () => {
        if (!commentRef.current) return null;
        let data = {
            userId: user?.id,
            postId: post?.id,
            text: commentRef.current
        };
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/comments', data);
            if (response.data.success) {
                if (user.id !== post.userId) {
                    let notify = {
                        senderId: user.id,
                        receiverId: post.userId,
                        title: 'commented on your post',
                        data: JSON.stringify({ postId: post.id, commentId: response.data.data.id })
                    };
                    await axios.post('http://localhost:5000/api/notifications', notify);
                }
                inputRef?.current?.clear();
                commentRef.current = '';
                setPost(prevPost => ({
                    ...prevPost,
                    comments: [response.data.data, ...prevPost.comments]
                }));
            } else {
                Alert.alert('Comment', response.data.msg);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create comment');
        } finally {
            setLoading(false);
        }
    };

    const onDeleteComment = async (comment) => {
        try {
            const response = await axios.delete(`http://localhost:5000/api/comments/${comment.id}`);
            if (response.data.success) {
                setPost(prevPost => {
                    let updatedPost = { ...prevPost };
                    updatedPost.comments = updatedPost.comments.filter(c => c.id !== comment.id);
                    return updatedPost;
                });
            } else {
                Alert.alert('Comment', response.data.msg);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to delete comment');
        }
    };

    const onDeletePost = async () => {
        try {
            const response = await axios.delete(`http://localhost:5000/api/posts/${post.id}`);
            if (response.data.success) {
                router.back();
            } else {
                Alert.alert('Post', response.data.msg);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to delete post');
        }
    };

    const onEditPost = async (item) => {
        router.back();
        router.push({ pathname: 'newPost', params: { ...item } });
    };

    if (startLoading) {
        return (
            <View style={styles.center}>
                <Loading />
            </View>
        );
    }

    if (!post) {
        return (
            <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}>
                <Text style={styles.notFound}>Post not found!</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                <PostCard
                    item={{ ...post, comments: [{ count: post?.comments?.length }] }}
                    currentUser={user}
                    router={router}
                    hasShadow={false}
                    showMoreIcon={false}
                    showDelete={true}
                    onDelete={onDeletePost}
                    onEdit={onEditPost}
                />
                <View style={styles.inputContainer}>
                    <Input
                        inputRef={inputRef}
                        placeholder="Type comment..."
                        onChangeText={value => commentRef.current = value}
                        placeholderTextColor={theme.colors.textLight}
                        containerStyle={{ flex: 1, height: hp(6.2), borderRadius: theme.radius.xl }}
                    />
                    {loading ? (
                        <View style={styles.loading}>
                            <Loading size="small" />
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}>
                            <Icon name="send" color={theme.colors.primaryDark} />
                        </TouchableOpacity>
                    )}
                </View>
                <View style={{ marginVertical: 15, gap: 17 }}>
                    {post?.comments?.map(comment =>
                        <CommentItem
                            key={comment?.id?.toString()}
                            item={comment}
                            onDelete={onDeleteComment}
                            highlight={comment.id == commentId}
                            canDelete={user.id == comment.userId || user.id == post.userId}
                        />
                    )}
                    {post?.comments?.length === 0 && (
                        <Text style={{ color: theme.colors.text, marginLeft: 5 }}>
                            Be first to comment!
                        </Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default PostDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: wp(7)
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    list: {
        paddingHorizontal: wp(4),
    },
    sendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.8,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous',
        height: hp(5.8),
        width: hp(5.8)
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notFound: {
        fontSize: hp(2.5),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium
    },
    loading: {
        height: hp(5.8),
        width: hp(5.8),
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: 1.3 }]
    }
});
