import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";


import { labTestService } from "../services/labtest.service";

export type LabTest = {
    id: number;
    name: string;
    billRate: number;
    createdAt: string;
    updatedAt: string;
};

export type LabTestQueryParams = {
    page?: number;
    limit?: number;
    search?: string;
};

export type LabTestResponse = {
    data: LabTest[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export type CreateLabTestRequest = {
    name: string;
    billRate: number;
};

export type UpdateLabTestRequest = {
    name: string;
    billRate: number;
};

export type LabTestSummary = {
    total: number;
    currentView: number;
    status: string;
};



/* =========================
   QUERY KEYS
========================= */

export const labTestKeys = {
    all: ["lab-tests"] as const,

    lists: () =>
        [...labTestKeys.all, "list"] as const,

    list: (params: LabTestQueryParams) =>
        [...labTestKeys.lists(), params] as const,

    details: () =>
        [...labTestKeys.all, "detail"] as const,

    detail: (id: number) =>
        [...labTestKeys.details(), id] as const,

    summary: () =>
        [...labTestKeys.all, "summary"] as const,
};

/* =========================
   GET ALL LAB TESTS
========================= */

// export function useAppointments(params?: AppointmentQueryParams) {
//     return useQuery({
//         queryKey: appointmentKeys.list(params ?? {}),
//         queryFn: () => appointmentService.getAppointments(params),
//     });
// }

export function useLabTests(
    params?: LabTestQueryParams
) {
    return useQuery({
        queryKey: labTestKeys.list(params ?? {}),

        queryFn: () =>
            labTestService.getLabTests(params),
    });
}

/* =========================
   GET SINGLE LAB TEST
========================= */

export function useLabTest(id: number) {
    return useQuery({
        queryKey: labTestKeys.detail(id),

        queryFn: () =>
            labTestService.getLabTestById(id),

        enabled: !!id,
    });
}

/* =========================
   CREATE LAB TEST
========================= */

export function useCreateLabTest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (
            data: CreateLabTestRequest
        ) =>
            labTestService.createLabTest(data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: labTestKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: labTestKeys.summary(),
            });
        },
    });
}

/* =========================
   UPDATE LAB TEST
========================= */

export function useUpdateLabTest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: number;
            data: UpdateLabTestRequest;
        }) =>
            labTestService.updateLabTest(
                id,
                data
            ),

        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: labTestKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: labTestKeys.detail(
                    variables.id
                ),
            });

            queryClient.invalidateQueries({
                queryKey: labTestKeys.summary(),
            });
        },
    });
}

/* =========================
   DELETE LAB TEST
========================= */

export function useDeleteLabTest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) =>
            labTestService.deleteLabTest(id),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: labTestKeys.lists(),
            });

            queryClient.invalidateQueries({
                queryKey: labTestKeys.summary(),
            });
        },
    });
}

/* =========================
   SUMMARY
========================= */

export function useLabTestSummary() {
    return useQuery({
        queryKey: labTestKeys.summary(),

        queryFn: () =>
            labTestService.getSummary(),
    });
}