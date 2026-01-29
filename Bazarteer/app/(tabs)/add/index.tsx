import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Alert,
    Pressable,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useAuth } from '@/contexts/AuthContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AddContentScreen() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [audioPermission, setAudioPermission] = useState(false);
    const [permissionsChecked, setPermissionsChecked] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
    const cameraRef = useRef<CameraView>(null);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const isVideoMode = useRef(false);
    const recordingStartTime = useRef(0);
    const { user } = useAuth();

    useEffect(() => {
        requestPermissions();
    }, []);

    const requestPermissions = async () => {
        try {
            const cameraStatus = await requestPermission();
            const audioStatus = await Audio.requestPermissionsAsync();
            setAudioPermission(audioStatus.granted);
            setPermissionsChecked(true);
        } catch (error) {
            console.error('Error requesting permissions:', error);
            setPermissionsChecked(true);
        }
    };

    if (!permission || !permissionsChecked) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>Loading...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>We need camera permission</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    async function uploadToAzureBlob(uri: string, filename: string) {
        try {
            const token = user?.jwt.trim().replace(/^"+|"+$/g, '');
            console.log(token)
            if (!token) {
                throw new Error('No authentication token available');
            }

            const response = await fetch(
                `http://74.248.81.121/product/generate-upload-url?filename=${encodeURIComponent(filename)}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`Failed to get upload URL: ${response.status} - ${responseText}`);
            }

            const { uploadUrl, blobUrl } = JSON.parse(responseText);

            const fileResponse = await fetch(uri);
            const fileBlob = await fileResponse.blob();


            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                    'Content-Type': fileBlob.type,
                },
                body: fileBlob,
            });


            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
            }

            return blobUrl;

        } catch (error) {
            console.error('❌ Upload error:', error);

            if (error instanceof Error) {
                Alert.alert('Upload Error', error.message);
            }

            throw error;
        }
    }


    const takePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                if (photo) {
                    const filename = `photo_${Date.now()}.jpg`;
                    const uploadedUrl = await uploadToAzureBlob(photo.uri, filename);
                    console.log('Uploaded photo URL:', uploadedUrl);

                    router.push({
                        pathname: '/(tabs)/add/preview',
                        params: {
                            type: 'photo',
                            uri: uploadedUrl,
                        },
                    });
                }
            } catch (error) {
                console.error('Error taking photo:', error);
                Alert.alert('Error', 'Failed to take photo');
            }
        }
    };

    const startRecording = async () => {
        if (cameraRef.current && !isRecording) {
            if (!audioPermission) {
                const audioStatus = await Audio.requestPermissionsAsync();
                setAudioPermission(audioStatus.granted);

                if (!audioStatus.granted) {
                    Alert.alert(
                        'Microphone Permission Required',
                        'Videos will be recorded without audio.',
                        [{ text: 'OK' }]
                    );
                }
            }

            try {
                setCameraMode('video');
                await new Promise(resolve => setTimeout(resolve, 100));

                setIsRecording(true);
                recordingStartTime.current = Date.now();

                const video = await cameraRef.current.recordAsync();

                if (video) {
                    const filename = `video_${Date.now()}.mp4`;
                    const uploadedUrl = await uploadToAzureBlob(video.uri, filename);
                    console.log('Uploaded video URL:', uploadedUrl);

                    router.push({
                        pathname: '/(tabs)/add/preview',
                        params: {
                            type: 'video',
                            uri: uploadedUrl,
                        },
                    });
                }
            } catch (error) {
                console.error('Error recording video:', error);
                Alert.alert('Error', 'Failed to record video. Please try again.');
            } finally {
                setIsRecording(false);
                isVideoMode.current = false;
                recordingStartTime.current = 0;
                setCameraMode('picture');
            }
        }
    };

    const stopRecording = () => {
        if (cameraRef.current && isRecording) {
            const duration = Date.now() - recordingStartTime.current;
            console.log('Stopping recording after', duration, 'ms');
            cameraRef.current.stopRecording();
        }
    };

    const handlePressIn = () => {
        isVideoMode.current = false;

        pressTimer.current = setTimeout(() => {
            isVideoMode.current = true;
            startRecording();
        }, 500);
    };

    const handlePressOut = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }

        if (isRecording) {
            stopRecording();
        } else if (!isVideoMode.current) {
            takePhoto();
        }
    };

    const openGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant gallery access');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 10,
        });

        if (!result.canceled) {
            const assets = result.assets;

            if (assets.length === 1 && assets[0].type === 'video') {
                const filename = `video_${Date.now()}.mp4`;
                const uploadedUrl = await uploadToAzureBlob(assets[0].uri, filename);
                router.push({
                    pathname: '/(tabs)/add/preview',
                    params: {
                        type: 'video',
                        uri: assets[0].uri,
                    },
                });
            } else if (assets.length >= 1) {
                try {
                    const uploadPromises = assets.map(async (asset, index) => {
                        const ext = asset.uri.split('.').pop() || 'jpg';
                        const filename = `gallery_${Date.now()}_${index}.${ext}`;
                        const uploadedUrl = await uploadToAzureBlob(asset.uri, filename);
                        return uploadedUrl;
                    });

                    const uploadedUrls = await Promise.all(uploadPromises);

                    router.push({
                        pathname: '/(tabs)/add/preview',
                        params: {
                            type: 'slideshow',
                            uris: uploadedUrls.join(','),
                        },
                    });
                } catch (error) {
                    Alert.alert('Error', 'Failed to upload images from gallery');
                }
            }
        }
    };

    return (
        <View style={styles.container}>
            <CameraView
                mode={cameraMode}
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('/(tabs)')}
                >
                    <View style={styles.iconButton}>
                        <Ionicons name="close" size={28} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>

                {isRecording && (
                    <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>Recording...</Text>
                    </View>
                )}

                <View style={styles.controls}>
                    <TouchableOpacity style={styles.galleryButton} onPress={openGallery}>
                        <View style={styles.galleryIconContainer}>
                            <Ionicons name="images-outline" size={28} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.captureContainer}>
                        <Pressable
                            style={[
                                styles.captureButton,
                                isRecording && styles.captureButtonRecording,
                            ]}
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                        >
                            <View
                                style={[
                                    styles.captureButtonInner,
                                    isRecording && styles.captureButtonInnerRecording,
                                ]}
                            />
                        </Pressable>
                        <Text style={styles.captureLabel}>
                            {isRecording ? 'Recording...' : 'Tap / Hold'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.flipButton}
                        onPress={toggleCameraFacing}
                    >
                        <Ionicons name="camera-reverse-outline" size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingIndicator: {
        position: 'absolute',
        top: 50,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 80, 0.9)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
    },
    recordingText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    controls: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    galleryButton: {
        width: 50,
        height: 50,
    },
    galleryIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureContainer: {
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 5,
        borderColor: '#FFFFFF',
    },
    captureButtonRecording: {
        backgroundColor: 'rgba(255, 0, 80, 0.3)',
        borderColor: '#FF0050',
    },
    captureButtonInner: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#FFFFFF',
    },
    captureButtonInnerRecording: {
        borderRadius: 8,
        width: 32,
        height: 32,
        backgroundColor: '#FF0050',
    },
    captureLabel: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 8,
        fontWeight: '600',
    },
    flipButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    permissionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});