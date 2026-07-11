import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/v1";

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Enables cookies sharing
    headers: {
        "Content-Type": "application/json",
    }
});

// Response interceptor to handle token refreshing automatically on 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url !== "/users/login" &&
            originalRequest.url !== "/users/refresh-token"
        ) {
            originalRequest._retry = true;
            try {
                // Trigger refresh token endpoint
                await axios.post(`${API_BASE_URL}/users/refresh-token`, {}, { withCredentials: true });
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh token is expired, log user out
                console.error("Refresh token expired, redirecting to login...");
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const authService = {
    register: async (formData) => {
        return apiClient.post("/users/register", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },
    login: async (email, password) => {
        return apiClient.post("/users/login", { email, password });
    },
    logout: async () => {
        return apiClient.post("/users/logout");
    },
    getCurrentUser: async () => {
        return apiClient.get("/users/current-user");
    },
    changePassword: async (oldpassword, newpassword, confpassword) => {
        return apiClient.post("/users/change-password", { oldpassword, newpassword, confpassword });
    },
    updateProfile: async (data) => {
        return apiClient.patch("/users/update-account", data);
    },
    updateAvatar: async (formData) => {
        return apiClient.patch("/users/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },
    verifyOtp: async (email, otp) => {
        return apiClient.post("/users/verify-otp", { email, otp });
    },
    resendOtp: async (email) => {
        return apiClient.post("/users/resend-otp", { email });
    }
};

export const cropReviewService = {
    create: async (formData) => {
        return apiClient.post("/crop-reviews", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },
    getAll: async (params = {}) => {
        return apiClient.get("/crop-reviews", { params });
    },
    getById: async (id) => {
        return apiClient.get(`/crop-reviews/${id}`);
    },
    update: async (id, formData) => {
        return apiClient.patch(`/crop-reviews/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },
    delete: async (id) => {
        return apiClient.delete(`/crop-reviews/${id}`);
    },
    toggleLike: async (id) => {
        return apiClient.post(`/crop-reviews/toggle-like/${id}`);
    },
    addPeerReview: async (cropId, data) => {
        return apiClient.post(`/crop-reviews/${cropId}/peer-reviews`, data);
    },
    getPeerReviews: async (cropId, params = {}) => {
        return apiClient.get(`/crop-reviews/${cropId}/peer-reviews`, { params });
    },
    deletePeerReview: async (cropId, peerReviewId) => {
        return apiClient.delete(`/crop-reviews/${cropId}/peer-reviews/${peerReviewId}`);
    }
};

export const seedReviewService = {
    create: async (formData) => {
        return apiClient.post("/seed-reviews", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },
    getAll: async (params = {}) => {
        return apiClient.get("/seed-reviews", { params });
    },
    getById: async (id) => {
        return apiClient.get(`/seed-reviews/${id}`);
    },
    update: async (id, formData) => {
        return apiClient.patch(`/seed-reviews/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },
    delete: async (id) => {
        return apiClient.delete(`/seed-reviews/${id}`);
    },
    toggleLike: async (id) => {
        return apiClient.post(`/seed-reviews/toggle-like/${id}`);
    }
};

export const fertilizerReviewService = {
    create: async (formData) => {
        return apiClient.post("/fertilizer-reviews", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },
    getAll: async (params = {}) => {
        return apiClient.get("/fertilizer-reviews", { params });
    },
    getById: async (id) => {
        return apiClient.get(`/fertilizer-reviews/${id}`);
    },
    update: async (id, formData) => {
        return apiClient.patch(`/fertilizer-reviews/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
    },
    delete: async (id) => {
        return apiClient.delete(`/fertilizer-reviews/${id}`);
    },
    toggleLike: async (id) => {
        return apiClient.post(`/fertilizer-reviews/toggle-like/${id}`);
    }
};

export const questionService = {
    create: async (data) => {
        return apiClient.post("/questions", data);
    },
    getAll: async (params = {}) => {
        return apiClient.get("/questions", { params });
    },
    getById: async (id) => {
        return apiClient.get(`/questions/${id}`);
    },
    delete: async (id) => {
        return apiClient.delete(`/questions/${id}`);
    },
    toggleLike: async (id) => {
        return apiClient.post(`/questions/toggle-like/${id}`);
    }
};

export const answerService = {
    create: async (questionId, answerText) => {
        return apiClient.post(`/answers/question/${questionId}`, { answer: answerText });
    },
    update: async (id, answerText) => {
        return apiClient.patch(`/answers/${id}`, { answer: answerText });
    },
    delete: async (id) => {
        return apiClient.delete(`/answers/${id}`);
    },
    toggleLike: async (id) => {
        return apiClient.post(`/answers/toggle-like/${id}`);
    }
};

export const commentService = {
    add: async (type, reviewId, content) => {
        return apiClient.post(`/comments/${type}/${reviewId}`, { content });
    },
    get: async (type, reviewId, params = {}) => {
        return apiClient.get(`/comments/${type}/${reviewId}`, { params });
    },
    update: async (id, content) => {
        return apiClient.patch(`/comments/${id}`, { content });
    },
    delete: async (id) => {
        return apiClient.delete(`/comments/${id}`);
    }
};

export const bookmarkService = {
    add: async (reviewType, reviewId) => {
        const payload = {};
        if (reviewType === "crop") payload.cropReviewId = reviewId;
        else if (reviewType === "seed") payload.seedReviewId = reviewId;
        else if (reviewType === "fertilizer") payload.fertilizerReviewId = reviewId;
        return apiClient.post("/bookmarks", payload);
    },
    getAll: async (params = {}) => {
        return apiClient.get("/bookmarks", { params });
    },
    remove: async (id) => {
        return apiClient.delete(`/bookmarks/${id}`);
    }
};

export const searchService = {
    search: async (params = {}) => {
        return apiClient.get("/search", { params });
    }
};

export const dashboardService = {
    getStats: async () => {
        return apiClient.get("/dashboard");
    }
};

export default apiClient;
