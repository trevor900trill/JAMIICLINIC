
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { usePathname, useRouter } from 'next/navigation';

export type ClinicSummary = {
    clinic_id: number;
    clinic_name: string;
};

interface ClinicContextType {
    clinics: ClinicSummary[];
    selectedClinic: ClinicSummary | null;
    setSelectedClinicId: (clinicId: number | null) => void;
    isLoading: boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const { apiFetch } = useApi();
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();

    const [clinics, setClinics] = useState<ClinicSummary[]>([]);
    const [selectedClinic, setSelectedClinic] = useState<ClinicSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchClinics = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        let endpoint = '';
        if (user.role === 'admin') {
            endpoint = '/api/clinics/';
        } else if (user.role === 'doctor') {
            endpoint = '/api/clinics/doctor/patients/';
        } else if (user.role === 'staff') {
            endpoint = '/api/clinics/staff/patients/';
        }

        if (!endpoint) {
             setIsLoading(false);
             return;
        }

        try {
            const response = await apiFetch(endpoint);
            if (!response.ok) {
                throw new Error("Failed to fetch clinics for user.");
            }
            const data = await response.json();
            
            let clinicSummaries: ClinicSummary[] = [];
            if (user.role === 'admin') {
                clinicSummaries = data.map((c: any) => ({
                    clinic_id: c.id,
                    clinic_name: c.name,
                }));
            } else {
                 clinicSummaries = data.map((c: any) => ({
                    clinic_id: c.clinic_id,
                    clinic_name: c.clinic_name,
                }));
            }
           
            setClinics(clinicSummaries);

            const storedClinicIdStr = localStorage.getItem('selectedClinicId');
            const storedClinicId = storedClinicIdStr ? parseInt(storedClinicIdStr) : null;
            const foundClinic = storedClinicId ? clinicSummaries.find(c => c.clinic_id === storedClinicId) : undefined;
            
            if (foundClinic) {
                setSelectedClinic(foundClinic);
            } else if (clinicSummaries.length > 0 && user.role !== 'admin') {
                // For non-admins, auto-select the first clinic
                setSelectedClinic(clinicSummaries[0]);
                localStorage.setItem('selectedClinicId', String(clinicSummaries[0].clinic_id));
            } else {
                setSelectedClinic(null);
                 if (user.role === 'admin') localStorage.removeItem('selectedClinicId');
            }

        } catch (error) {
            if (error instanceof Error && error.message === "Unauthorized") return;
            toast({ variant: "destructive", title: "Error", description: "Could not fetch your clinics." });
            setClinics([]);
            setSelectedClinic(null);
        } finally {
            setIsLoading(false);
        }
    }, [user, apiFetch, toast]);

    useEffect(() => {
        fetchClinics();
    }, [fetchClinics]);

    const setSelectedClinicId = (clinicId: number | null) => {
        if (clinicId === null) {
            setSelectedClinic(null);
            localStorage.removeItem('selectedClinicId');
        } else {
            const clinic = clinics.find(c => c.clinic_id === clinicId) || null;
            setSelectedClinic(clinic);
            if (clinic) {
                localStorage.setItem('selectedClinicId', String(clinic.clinic_id));
            } else {
                localStorage.removeItem('selectedClinicId');
            }
        }

        // When clinic changes, navigate to a safe, non-specific page if needed
        const pathSegments = pathname.split('/').filter(Boolean);
        if (pathSegments.length > 2) {
            const newPath = `/${pathSegments[0]}/${pathSegments[1]}`;
            router.push(newPath);
        }
    };
    
    // Don't render child pages that rely on clinic context until a clinic is selected (for non-admins)
    const shouldRenderChildren = user?.role === 'admin' || isLoading || (clinics.length > 0 && selectedClinic) || clinics.length === 0;

    return (
        <ClinicContext.Provider value={{ clinics, selectedClinic, setSelectedClinicId, isLoading }}>
            {children}
        </ClinicContext.Provider>
    );
};

export const useClinic = () => {
    const context = useContext(ClinicContext);
    if (context === undefined) {
        throw new Error('useClinic must be used within a ClinicProvider');
    }
    return context;
};
