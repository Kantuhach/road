import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';
import { API_ORIGIN } from './apiConfig';
import './styles.css';

if (API_ORIGIN) {
  axios.defaults.baseURL = API_ORIGIN;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
