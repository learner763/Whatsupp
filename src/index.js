import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App'; 
import Home from './Home'; 
import Profile from './Profile'; 
import reportWebVitals from './reportWebVitals';
import { Navigate } from 'react-router-dom';
function Root_Route()
{
    const email=localStorage.getItem('email')
    const profile=localStorage.getItem('profile')
    const root_url=localStorage.getItem('root')
    if(root_url==="true" || !email){return <App />} 
    else if(!profile){return <Navigate to='/profile' replace/>} 
    else {return <Navigate to='/home' replace/>}
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Router>
            <Routes>
                <Route path="/" element={<Root_Route/>} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
            </Routes>
        </Router>
    </React.StrictMode>
);
reportWebVitals();