import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { hp } from '../helpers/common';
import { theme } from '../constants/theme';
import { Image } from 'expo-image';
import axios from 'axios';

const Avatar = ({
    uri,
    size = hp(4.5),
    rounded = theme.radius.md,
    style = {}
}) => {
    const [imageSrc, setImageSrc] = useState(null);

    useEffect(() => {
        const fetchImageSrc = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/images/${uri}`);
                if (response.data.success) {
                    setImageSrc(response.data.data);
                } else {
                    console.error('Failed to fetch image source:', response.data.msg);
                }
            } catch (error) {
                console.error('Error fetching image source:', error);
            }
        };

        fetchImageSrc();
    }, [uri]);

    return (
        <Image
            source={{ uri: imageSrc }}
            transition={100}
            style={[styles.avatar, { height: size, width: size, borderRadius: rounded }, style]}
        />
    );
};

export default Avatar;

const styles = StyleSheet.create({
    avatar: {
        borderCurve: 'continuous',
        borderColor: theme.colors.darkLight,
        borderWidth: 1
    }
});
