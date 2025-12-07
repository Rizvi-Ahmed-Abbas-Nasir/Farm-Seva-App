import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';

interface CountdownTimerProps {
    targetDate: Date;
    label: string;
    color?: string;
    backgroundColor?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
    targetDate,
    label,
    color = '#3B82F6',
    backgroundColor = '#EFF6FF'
}) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft('Due now');
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <View style={styles.iconContainer}>
                <Clock size={14} color={color} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.label, { color }]}>{label}</Text>
                <Text style={[styles.time, { color }]}>{timeLeft}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    iconContainer: {
        marginRight: 8,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    time: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
