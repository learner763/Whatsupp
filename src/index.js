import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import App from './App'; // Ensure the file name matches exactly (case-sensitive)
import Home from './Home'; // Ensure the file name matches exactly (case-sensitive)
import Profile from './Profile'; // Ensure the file name matches exactly (case-sensitive)
import reportWebVitals from './reportWebVitals';

function Route_to_root()
{
  const nav1=useNavigate();
  const [key1,set_key1]=useState(localStorage.getItem('email'))
  const [key2,set_key2]=useState(localStorage.getItem('root'))
  const condition=key1 &&(!key2 || key2==="false");
  useEffect(()=>
  {
    function check()
    {
      set_key1(localStorage.getItem('email'))
      set_key2(localStorage.getItem('root'))
      if(condition)
      {
        nav1('/home');
      }
    }
    check()
    window.addEventListener('storage',check)
    return () => {
      window.removeEventListener('storage', check);
    };
  },[])
  return (
      <Routes>
        <Route path="/" element={condition?<Navigate to="/home" /> :<App />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
  );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Route_to_root />
    </Router>
  </React.StrictMode>
);

reportWebVitals();