import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OrderScreen() {
    const params = useLocalSearchParams();
    const { user } = useAuth();
    const productPrice = params.productPrice ? parseFloat(params.productPrice.toString()) : 45.99;

    const orderData = {
        productId: params.productId,
        productTitle: params.productTitle?.toString() || 'Handmade Item',
        productPrice: productPrice,
        productLocation: params.productLocation,
        creatorName: params.creatorName?.toString() || 'John',
        creatorSurname: params.creatorSurname?.toString() || 'Doe',
        creatorId: params.creatorId?.toString()
    };

    const [formData, setFormData] = useState({
        email: '',
        postalCode: '',
        city: '',
        country: '',
        telephone: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
    });

    const [saveBilling, setSaveBilling] = useState(false);
    const [savePayment, setSavePayment] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const shipping = 5.00;
    const provision = orderData.productPrice * 0.05;
    const tax = (orderData.productPrice + shipping + provision) * 0.22;
    const total = orderData.productPrice + shipping + provision + tax;

    const formatCardNumber = (text: string) => {
        const cleaned = text.replace(/\s/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        return formatted.substring(0, 19);
    };

    const formatExpiryDate = (text: string) => {
        const cleaned = text.replace(/\//g, '');
        if (cleaned.length >= 2) {
            return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
        }
        return cleaned;
    };

    const handleCardNumberChange = (text: string) => {
        const formatted = formatCardNumber(text);
        setFormData(prev => ({ ...prev, cardNumber: formatted }));
    };

    const handleExpiryChange = (text: string) => {
        const formatted = formatExpiryDate(text);
        setFormData(prev => ({ ...prev, expiryDate: formatted }));
    };

    const handleCvvChange = (text: string) => {
        setFormData(prev => ({ ...prev, cvv: text.substring(0, 3) }));
    };

    const handleConfirmOrder = async () => {
        console.log('Form Data:', formData);

        if (!formData.email || !formData.postalCode || !formData.city || !formData.country) {
            Alert.alert('Missing Information', 'Please fill in all required billing fields');
            return;
        }

        if (!formData.cardNumber || !formData.expiryDate || !formData.cvv) {
            Alert.alert('Missing Payment Details', 'Please fill in all card details');
            return;
        }

        setIsSubmitting(true);

        try {
            const sellerId = orderData.creatorId
            const customerLocation = formData.city + formData.country
            const productLocation = orderData.productLocation
            const finalPrice = total
            const productId = orderData.productId
            const cardNum = formData.cardNumber
            const expiry = formData.expiryDate
            const cvv = formData.cvv

            const response = await fetch('http://74.248.81.121/order/placeOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.jwt.trim().replace(/^"+|"+$/g, '')}`
                },
                body: JSON.stringify({ sellerId, customerLocation, productLocation, finalPrice, productId, cardNum, expiry, cvv })
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error){
                    Alert.alert('Fail', 'Card details are incorrect!', [
                        {
                        text: 'OK',
                        onPress: () => setIsSubmitting(false)
                        },
                    ]);
                return
                } else {
                    throw new Error("Napaka pri naročilu");
                }
            }

            Alert.alert('Success', 'Product ordered successfully!', [
                {
                    text: 'OK',
                    onPress: () => router.push('/(tabs)'),
                },
            ]);
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error("Napaka pri prijavi2");
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Complete Order</Text>
                </View>

                {/* Section 1: Product Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Product</Text>

                    <View style={styles.productInfo}>
                        <View style={styles.productDetails}>
                            <Text style={styles.productTitle}>{orderData.productTitle}</Text>
                            <Text style={styles.creatorName}>
                                by {orderData.creatorName} {orderData.creatorSurname}
                            </Text>
                        </View>

                        <View style={styles.priceBreakdown}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Product price</Text>
                                <Text style={styles.priceValue}>€{orderData.productPrice.toFixed(2)}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Shipping</Text>
                                <Text style={styles.priceValue}>€{shipping.toFixed(2)}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Provision</Text>
                                <Text style={styles.priceValue}>€{provision.toFixed(2)}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Tax (22%)</Text>
                                <Text style={styles.priceValue}>€{tax.toFixed(2)}</Text>
                            </View>
                            <View style={[styles.priceRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalValue}>€{total.toFixed(2)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Section 2: Billing Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Billing Information</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>
                            Email <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="your@email.com"
                            placeholderTextColor="#666666"
                            value={formData.email}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, styles.halfWidth]}>
                            <Text style={styles.inputLabel}>
                                Postal Code <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1000"
                                placeholderTextColor="#666666"
                                value={formData.postalCode}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, postalCode: text }))}
                                keyboardType="number-pad"
                            />
                        </View>

                        <View style={[styles.formGroup, styles.halfWidth]}>
                            <Text style={styles.inputLabel}>
                                City <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ljubljana"
                                placeholderTextColor="#666666"
                                value={formData.city}
                                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>
                            Country <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Slovenia"
                            placeholderTextColor="#666666"
                            value={formData.country}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Telephone (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+386 XX XXX XXX"
                            placeholderTextColor="#666666"
                            value={formData.telephone}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, telephone: text }))}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setSaveBilling(!saveBilling)}
                    >
                        <View style={styles.checkbox}>
                            {saveBilling && <Ionicons name="checkmark" size={18} color="#6366F1" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Save billing information</Text>
                    </TouchableOpacity>
                </View>

                {/* Section 3: Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>

                    <View style={styles.paymentMethods}>
                        <TouchableOpacity
                            style={[styles.paymentOption, styles.paymentOptionActive]}
                        >
                            <View style={styles.paymentIconContainer}>
                                <Ionicons name="card" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.paymentText}>Mastercard</Text>
                            <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cardDetails}>
                        <View style={styles.formGroup}>
                            <Text style={styles.inputLabel}>
                                Card Number <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="1234 5678 9012 3456"
                                placeholderTextColor="#666666"
                                value={formData.cardNumber}
                                onChangeText={handleCardNumberChange}
                                keyboardType="number-pad"
                                maxLength={19}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.formGroup, styles.halfWidth]}>
                                <Text style={styles.inputLabel}>
                                    Expiry Date <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="MM/YY"
                                    placeholderTextColor="#666666"
                                    value={formData.expiryDate}
                                    onChangeText={handleExpiryChange}
                                    keyboardType="number-pad"
                                    maxLength={5}
                                />
                            </View>

                            <View style={[styles.formGroup, styles.halfWidth]}>
                                <Text style={styles.inputLabel}>
                                    CVV <Text style={styles.required}>*</Text>
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="123"
                                    placeholderTextColor="#666666"
                                    value={formData.cvv}
                                    onChangeText={handleCvvChange}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                    secureTextEntry
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setSavePayment(!savePayment)}
                    >
                        <View style={styles.checkbox}>
                            {savePayment && <Ionicons name="checkmark" size={18} color="#6366F1" />}
                        </View>
                        <Text style={styles.checkboxLabel}>Save payment method</Text>
                    </TouchableOpacity>
                </View>

                {/* Section 4: Confirm Order */}
                <View style={[styles.section, styles.confirmSection]}>
                    <Text style={styles.sectionTitle}>Confirm Order</Text>

                    <View style={styles.finalPriceBreakdown}>
                        <View style={styles.finalPriceRow}>
                            <Text style={styles.finalPriceLabel}>Shipping</Text>
                            <Text style={styles.finalPriceValue}>€{shipping.toFixed(2)}</Text>
                        </View>
                        <View style={styles.finalPriceRow}>
                            <Text style={styles.finalPriceLabel}>Provision</Text>
                            <Text style={styles.finalPriceValue}>€{provision.toFixed(2)}</Text>
                        </View>
                        <View style={styles.finalPriceRow}>
                            <Text style={styles.finalPriceLabel}>Tax</Text>
                            <Text style={styles.finalPriceValue}>€{tax.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.finalPriceRow, styles.finalTotalRow]}>
                            <Text style={styles.finalTotalLabel}>Total</Text>
                            <Text style={styles.finalTotalValue}>€{total.toFixed(2)}</Text>
                        </View>
                    </View>

                    {/* Confirm Button */}
                    <TouchableOpacity
                        style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
                        onPress={handleConfirmOrder}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Text style={styles.confirmButtonText}>Processing...</Text>
                        ) : (
                            <>
                                <Text style={styles.confirmButtonText}>Confirm Order</Text>
                                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <Navbar activeTab="orders" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    productInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
    },
    productDetails: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    productTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    creatorName: {
        fontSize: 14,
        color: '#999999',
    },
    priceBreakdown: {
        gap: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14,
        color: '#CCCCCC',
    },
    priceValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6366F1',
    },
    formGroup: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 14,
        color: '#CCCCCC',
        marginBottom: 8,
        fontWeight: '500',
    },
    required: {
        color: '#FF0050',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        alignSelf: 'flex-end',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#6366F1',
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#CCCCCC',
    },
    paymentMethods: {
        gap: 12,
        marginBottom: 16,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    paymentOptionActive: {
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    paymentIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    paymentText: {
        flex: 1,
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    cardDetails: {
        marginBottom: 16,
    },
    confirmSection: {
        marginBottom: 20,
    },
    finalPriceBreakdown: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    finalPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    finalPriceLabel: {
        fontSize: 14,
        color: '#CCCCCC',
    },
    finalPriceValue: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    finalTotalRow: {
        marginTop: 8,
        paddingTop: 12,
        marginBottom: 0,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.2)',
    },
    finalTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    finalTotalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#6366F1',
    },
    confirmButton: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    confirmButtonDisabled: {
        backgroundColor: '#4B5563',
        shadowOpacity: 0,
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});