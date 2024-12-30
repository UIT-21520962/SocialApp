import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../helpers/common';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../../components/Avatar';
import RichTextEditor from '../../components/RichTextEditor';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from '../../assets/icons';
import { TouchableOpacity } from 'react-native';
import Button from '../../components/Button';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import axios from 'axios';

const NewPost = () => {
    const post = useLocalSearchParams();
    const { user } = useAuth();
    const bodyRef = useRef("");
    const editorRef = useRef(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (post && post.id) {
            bodyRef.current = post.body;
            setFile(post.file || null);
            setTimeout(() => {
                editorRef?.current?.setContentHTML(post.body);
            }, 50);
        }
    }, [post]);

    const onPick = async (isImage) => {
        let mediaConfig = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7
        };
        if (!isImage) {
            mediaConfig = {
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
            };
        }
        let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);
        if (!result.canceled) {
            setFile(result.assets[0]);
        }
    };

    const isLocalFile = (file) => {
        if (!file) return null;
        if (typeof file == 'object') return true;
        return false;
    };

    const getFileType = (file) => {
        if (!file) return null;
        if (isLocalFile(file)) {
            return file.type;
        }
        if (file.includes('postImages')) {
            return 'image';
        }
        return 'video';
    };

    const getFileUri = (file) => {
        if (!file) return null;
        if (isLocalFile(file)) {
            return file.uri;
        }
        return getSupabaseFileUrl(file)?.uri;
    };

    const onSubmit = async () => {
        if (!bodyRef.current && !file) {
            Alert.alert('Post', "Please choose a media or add post contents");
            return;
        }

        const data = {
            file,
            body: bodyRef.current,
            userId: user?.id,
        };

        if (post && post.id) data.id = post.id;

        setLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/posts', data);

            if (response.data.success) {
                setFile(null);
                bodyRef.current = '';
                editorRef.current?.setContentHTML('');
                router.back();
            } else {
                Alert.alert('Post', response.data.msg);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Post', 'Error occurred while creating the post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                <Header title="Create Post" />
                <ScrollView contentContainerStyle={{ gap: 20 }}>
                    <View style={styles.header}>
                        <Avatar
                            uri={user?.image}
                            size={hp(6.5)}
                            rounded={theme.radius.xl}
                        />
                        <View style={{ gap: 2 }}>
                            <Text style={styles.username}>
                                {user && user.name}
                            </Text>
                            <Text style={styles.publicText}>Public</Text>
                        </View>
                    </View>

                    <View style={styles.textEditor}>
                        <RichTextEditor editorRef={editorRef} onChange={(body) => bodyRef.current = body} />
                    </View>

                    {file && (
                        <View style={styles.file}>
                            {
                                getFileType(file) === 'video' ? (
                                    <Video
                                        style={{ flex: 1 }}
                                        source={{
                                            uri: getFileUri(file)
                                        }}
                                        useNativeControls
                                        resizeMode='cover'
                                        isLooping
                                    />
                                ) : (
                                    <Image source={{ uri: getFileUri(file) }} resizeMode='cover' style={{ flex: 1 }} />
                                )
                            }
                            <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
                                <Icon name="delete" size={20} color='white' />
                            </Pressable>
                        </View>
                    )}

                    <View style={styles.media}>
                        <Text style={styles.addImageText}>Add to your post</Text>
                        <View style={styles.mediaIcons}>
                            <TouchableOpacity onPress={() => onPick(true)}>
                                <Icon name="image" size={30} theme={theme.colors.dark} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onPick(false)}>
                                <Icon name="video" size={30} theme={theme.colors.dark} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                <Button
                    buttonStyle={{ height: hp(6.2) }}
                    title={post && post.id ? "Update" : "Post"}
                    loading={loading}
                    hasShadow={false}
                    onPress={onSubmit}
                />
            </View>
        </ScreenWrapper>
    );
};

export default NewPost;

const styles = StyleSheet.create({
    closeIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 7,
        borderRadius: 50,
        backgroundColor: 'rgba(255,0,0, 0.6)'
    },
    file: {
        height: hp(30),
        borderRadius: theme.radius.m,
        overflow: 'hidden',
        marginVertical: 20
    },
    media: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addImageText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.dark
    },
    mediaIcons: {
        flexDirection: 'row',
        gap: 10,
    },
    textEditor: {
        height: hp(20),
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
        borderRadius: theme.radius.m,
        padding: 10,
    },
    container: {
        flex: 1,
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.dark,
    },
    publicText: {
        fontSize: 14,
        color: theme.colors.gray,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    }
});
