
"use client"

import { useAuth } from "@/context/auth-context";
import { API_BASE_URL } from "@/lib/config";
import { useToast } from "./use-toast";
import React from "react";

export const useApi = () => {
    const { getAuthToken, logout } = useAuth();
    const { toast } = useToast();

    const apiFetch = React.useCallback(async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
        const token = getAuthToken();
        const headers = new Headers(options.headers || {});
        
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            toast({
                variant: "destructive",
                title: "Session Expired",
                description: "You have been logged out. Please sign in again.",
            });
            logout();
            // Throw an error to stop the execution of the calling function
            throw new Error("Unauthorized");
        }

        return response;
    }, [getAuthToken, logout, toast]);

    return { apiFetch };
};
