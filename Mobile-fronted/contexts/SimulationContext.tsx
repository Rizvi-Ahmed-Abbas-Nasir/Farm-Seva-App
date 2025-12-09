import React, { createContext, useState, useContext, ReactNode } from 'react';

interface SimulationState {
    temperature: number;
    humidity: number;
    ammonia: number;
    waterLevel: number;
    airQuality: number;
    ventilation: boolean;
    waterChlorination: boolean;
    sterilization: boolean;
    fanSpeed: number; // 0-100
    isSimulationMode: boolean;
}

interface SimulationContextType extends SimulationState {
    updateMetric: (key: keyof SimulationState, value: number | boolean) => void;
    toggleSimulationMode: () => void;
    resetSimulation: () => void;
}

const defaultState: SimulationState = {
    temperature: 24.5,
    humidity: 60,
    ammonia: 5,
    waterLevel: 80,
    airQuality: 95,
    ventilation: true,
    waterChlorination: true,
    sterilization: false,
    fanSpeed: 50,
    isSimulationMode: true, // Default to true for demo purposes as requested
};

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<SimulationState>(defaultState);

    const updateMetric = (key: keyof SimulationState, value: number | boolean) => {
        setState((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const toggleSimulationMode = () => {
        setState((prev) => ({
            ...prev,
            isSimulationMode: !prev.isSimulationMode,
        }));
    };

    const resetSimulation = () => {
        setState(defaultState);
    };

    return (
        <SimulationContext.Provider
            value={{
                ...state,
                updateMetric,
                toggleSimulationMode,
                resetSimulation,
            }}
        >
            {children}
        </SimulationContext.Provider>
    );
};

export const useSimulation = () => {
    const context = useContext(SimulationContext);
    if (context === undefined) {
        throw new Error('useSimulation must be used within a SimulationProvider');
    }
    return context;
};
