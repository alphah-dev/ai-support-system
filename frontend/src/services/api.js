// frontend/src/services/api.js
import axios from 'axios';

// Get the backend API base URL from environment variables or default to localhost:8000
// Vite uses import.meta.env instead of process.env
// --- Using localhost as curl test from PowerShell succeeded with localhost ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Log the URL being used for verification in the browser console
console.log(`Connecting to API at: ${API_BASE_URL}`);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // Add any other default headers if needed, like Authorization later
  },
  // timeout: 10000, // Optional: set timeout for requests (e.g., 10 seconds)
});

// --- Error Handling Interceptor (Optional but Recommended) ---
apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Log detailed error information
    console.error('API Call Error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Headers:', error.response.headers);
       // Return a more structured error object or message if desired
       return Promise.reject({
         status: error.response.status,
         message: error.response.data?.detail || error.message, // Use detail field from FastAPI errors if available
         data: error.response.data
       });
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser
      console.error('Error Request:', error.request);
      // *** This is the error message you were likely seeing ***
      return Promise.reject({ message: 'No response received from server. Check backend connection.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error Message:', error.message);
       return Promise.reject({ message: `Error setting up request: ${error.message}` });
    }
  }
);


// --- API Function Definitions ---

// == Tickets ==
export const getTickets = (params) => apiClient.get('/tickets/', { params });
export const getTicketById = (id) => apiClient.get(`/tickets/${id}`);
export const createTicket = (ticketData) => apiClient.post('/tickets/', ticketData);
export const updateTicketStatus = (id, status) => apiClient.patch(`/tickets/${id}/status`, { status });
export const assignTicket = (id, assignment) => apiClient.patch(`/tickets/${id}/assignment`, assignment);
// Add deleteTicket if needed: export const deleteTicket = (id) => apiClient.delete(`/tickets/${id}`);

// == Summarization ==
export const summarizeText = (text) => apiClient.post('/summarize/', { text }); // Body needs `text` key

// == Recommendation ==
export const getRecommendations = (ticketId, topN = 3) => apiClient.get(`/recommend/${ticketId}`, { params: { top_n: topN } });
export const postRecommendationFeedback = (feedbackData) => apiClient.post('/recommend/feedback', feedbackData);

// == Routing == (Example - assuming POST to /route)
export const routeTicket = (routingData) => apiClient.post('/route/', routingData);

// == Prediction == (Example - assuming POST to /predict)
export const predictResolutionTime = (predictionData) => apiClient.post('/predict/', predictionData);

// == Dashboard / Metrics == (Example - needs backend endpoint)
// TODO: Create a GET /dashboard/metrics endpoint on the backend
export const getDashboardMetrics = () => apiClient.get('/dashboard/metrics'); // Placeholder


export default apiClient; // Export the configured client if needed elsewhere