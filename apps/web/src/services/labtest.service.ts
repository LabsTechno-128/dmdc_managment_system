/* =========================
   API SERVICE
========================= */

import type { CreateLabTestRequest, LabTest, LabTestQueryParams, LabTestResponse, LabTestSummary, UpdateLabTestRequest } from "../hooks/useLabTest";
import { api } from "../lib/api";

export const labTestService = {
    // getUpcomingAppointments: async (): Promise<Appointment[]> => {
    //     const { data } = await api.get('/appointments/upcoming');
    //     return data as Appointment[];
    // },
    getLabTests: async (
        params?: LabTestQueryParams
    ): Promise<LabTestResponse> => {
        const response = await api.get<any>(
            "/lab-tests",
            { params }
        );
        return {
            data: response.data,
            meta: (response as any).meta,
        };
    },

    // --- Parameters ---

    getParameters: async (testId: number) => {
        const { data } = await api.get(`/lab-tests/${testId}/parameters`);
        return data;
    },

    createParameter: async (testId: number, payload: any) => {
        const { data } = await api.post(`/lab-tests/${testId}/parameters`, payload);
        return data;
    },

    updateParameter: async (testId: number, paramId: string, payload: any) => {
        const { data } = await api.patch(`/lab-tests/${testId}/parameters/${paramId}`, payload);
        return data;
    },

    deleteParameter: async (testId: number, paramId: string) => {
        await api.delete(`/lab-tests/${testId}/parameters/${paramId}`);
    },

    reorderParameters: async (testId: number, parameterIds: string[]) => {
        const { data } = await api.patch(`/lab-tests/${testId}/parameters/reorder`, { parameterIds });
        return data;
    },

    getLabTestById: async (
        id: number
    ): Promise<LabTest> => {
        const { data } = await api.get<LabTest>(
            `/lab-tests/${id}`
        );
        return data
    },

    getSummary: async (): Promise<LabTestSummary> => {
        const { data } = await api.get<LabTestSummary>(
            "/lab-tests/stats/summary"
        );
        return data
    },

    createLabTest: async (
        payload: CreateLabTestRequest
    ): Promise<LabTest> => {
        const { data } = await api.post<LabTest>(
            "/lab-tests",
            payload
        );
        return data
    },

    updateLabTest: async (
        id: number,
        payload: UpdateLabTestRequest
    ): Promise<LabTest> => {
        const { data } = await api.patch<LabTest>(
            `/lab-tests/${id}`,
            payload
        );
        return data
    },

    deleteLabTest: async (
        id: number
    ): Promise<void> => {
        await api.delete(`/lab-tests/${id}`);
    },
};
