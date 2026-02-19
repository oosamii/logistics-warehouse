import axios from "axios";

const API = axios.create({
  baseURL: "/api", // change if needed
});

// Get order details
export const getPackOrder = (orderId) => API.get(`/packing/orders/${orderId}`);

// Get items to pack
export const getItemsToPack = (orderId) =>
  API.get(`/packing/orders/${orderId}/items`);

// Get current carton
export const getCurrentCarton = (orderId) =>
  API.get(`/packing/orders/${orderId}/carton`);

// Add item to carton
export const addItemToCarton = (orderId, payload) =>
  API.post(`/packing/orders/${orderId}/carton/add`, payload);

// Close carton
export const closeCarton = (orderId) =>
  API.post(`/packing/orders/${orderId}/carton/close`);
