import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token into authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle global response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear authentication if token is expired or unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

// Company Profile API helpers
export const getCompanyProfile = () => api.get('/hr/company/profile');
export const createCompanyProfile = (data, config) => api.post('/hr/company/profile', data, config);
export const updateCompanyProfile = (data, config) => api.put('/hr/company/profile', data, config);

// Placement Drive API helpers (HR)
export const getHRDrives = () => api.get('/hr/drives');
export const createPlacementDrive = (data) => api.post('/hr/drives', data);
export const updateHRDrive = (id, data) => api.put(`/hr/drives/${id}`, data);
export const deleteHRDrive = (id) => api.delete(`/hr/drives/${id}`);
export const getDriveApplicants = (driveId) => api.get(`/hr/drives/${driveId}/applicants`);
export const updateApplicantStatus = (driveId, data) => api.put(`/hr/drives/${driveId}/applicants/status`, data);
export const exportCandidates = (driveId, status) => api.get(`/hr/drives/${driveId}/export?status=${encodeURIComponent(status)}`, { responseType: 'blob' });
export const generateInterviewSlots = (driveId, data) => api.post(`/hr/drives/${driveId}/interview-slots/generate`, data);
export const getInterviewSlots = (driveId) => api.get(`/hr/drives/${driveId}/interview-slots`);
export const deleteInterviewSlot = (driveId, slotId) => api.delete(`/hr/drives/${driveId}/interview-slots/${slotId}`);

// Notification API helpers (HR)
export const getHRNotifications = () => api.get('/hr/notifications');
export const markNotificationRead = (id) => api.put(`/hr/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/hr/notifications/mark-all-read');

// Placement Drive API helpers (Student)
export const getStudentDrives = () => api.get('/student/drives');
export const registerForDrive = (id) => api.post(`/student/drives/${id}/register`);
export const getAvailableInterviewSlots = (id) => api.get(`/student/drives/${id}/interview-slots`);
export const bookInterviewSlot = (id, slotId) => api.post(`/student/drives/${id}/interview-slots/${slotId}/book`);

// Notification API helpers (Student)
export const getStudentNotifications = () => api.get('/student/notifications');
export const markStudentNotificationRead = (id) => api.put(`/student/notifications/${id}/read`);
export const markAllStudentNotificationsRead = () => api.put('/student/notifications/mark-all-read');

// Placement Drive API helpers (Admin)
export const getAdminDrives = () => api.get('/admin/drives');
export const updateAdminDriveTimeline = (id, data) => api.put(`/admin/drives/${id}/timeline`, data);

