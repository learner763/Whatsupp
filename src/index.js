import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App'; 
import Home from './Home'; 
import Profile from './Profile'; 
import Pr from './Pr'; 
import reportWebVitals from './reportWebVitals';
import { Navigate } from 'react-router-dom';
function Root_Route()
{
    const email=localStorage.getItem('email')
    const password=localStorage.getItem('password')
    const logged_in=localStorage.getItem('logged_in')
    const token=localStorage.getItem('token')
    if(email || password || !logged_in || !token)
    {
        return <App/>
    }
    else
    {
        return <Navigate to="/home" replace/>
    }
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<Root_Route/>} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/pr" element={<Pr />} />
            </Routes>
        </Router>
    </React.StrictMode>
);
reportWebVitals();