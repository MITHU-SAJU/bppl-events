import axios from "axios";

const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://bppl-events.onrender.com";


// Configure axios to automatically attach the token if available
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Configure axios to automatically handle 401 Unauthorized errors
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("adminToken");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export const adminLogin = (data) => {
    return axios.post(`${API}/admin/login`, data);
};

export const createEvent = (data) => {
    return axios.post(`${API}/events`, data);
};

export const getEvents = () => {
    return axios.get(`${API}/events`);
};

export const getEmployees = () => {
    return axios.get(`${API}/employees`);
};

export const createEmployee = (data) => {
    return axios.post(`${API}/employees`, data);
};

export const deleteEmployee = (id) => {
    return axios.delete(`${API}/employees/${id}`);
};

export const updateEvent = (id, data) => {
    return axios.put(`${API}/events/${id}`, data);
};

export const deleteEvent = (id) => {
    return axios.delete(`${API}/events/${id}`);
};

export const getEmployeeEvents = (employeeId) => {
    return axios.get(`${API}/events/employee/${employeeId}`);
};

export const getParticulars = () => {
    return axios.get(`${API}/particulars`);
};

export const createParticular = (data) => {
    return axios.post(`${API}/particulars`, data);
};

export const deleteParticular = (id) => {
    return axios.delete(`${API}/particulars/${id}`);
};

export const getInvoices = () => {
    return axios.get(`${API}/invoices`);
};

export const createInvoice = (data) => {
    return axios.post(`${API}/invoices`, data);
};

export const updateInvoice = (id, data) => {
    return axios.put(`${API}/invoices/${id}`, data);
};

export const deleteInvoice = (id) => {
    return axios.delete(`${API}/invoices/${id}`);
};

