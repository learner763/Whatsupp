import React, { use, useEffect, useState } from 'react';
import './Profile.css';
import axios from 'axios'; 
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function Profile() {
  const [name, setname] = useState('');
  const [bio, setbio] = useState('');
  const nav1=useNavigate();
  const username=localStorage.getItem("email");

    function personal_info(name,bio)
    {
      let flag=false
      if(name.length<13 && bio.length<21)
      {
        fetch('/accounts')
        .then(response => response.json())
        .then(data=>{
          for(let i=0;i<data.length;i++)
          {
            if(data[i].name==name && data[i].email!=username)
            {
              flag=true;
              alert(`${name} is taken by another user!Choose different.`)
            }
          }
          if(!flag)
            {
            localStorage.setItem('profile',name)
            fetch('/personal', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username: username, name: name,bio:bio }),
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if(data.success===true)
                {
                  nav1('/home');
                }
              
            })
            .catch(error => {
              console.error('Error:', error);
            });
            }
        })
          
      }
      else{
        alert("Name and About should be 12 and 20 characters max respectively!");
      }
    }
    useEffect(()=>
    {
      fetch('/accounts')
      .then(response => response.json())
      .then(data=>{
        for(let i=0;i<data.length;i++)
        {
          if(data[i].email===username)
          {
            setname(data[i].name);
            setbio(data[i].bio);
          }
        }
      })
    },[username]
    )
      
      

  
  return (
      <div className="Profile" >
        <div style={{display:'flex',flexDirection:'column',borderRadius:'40px',backgroundColor:'lightgreen'}}>
        <img id="bg" src="bg.png" alt="Background" />
        <label >Profile Name*</label>
       <input
          type="text"
          value={name}
          placeholder='Name:'
          onChange={(e) => setname(e.target.value.replace(/[^a-zA-Z0-9_ ]/g,''))} 
        />
        <label >About Me*</label>

        <input
          type="text"
          value={bio}
          placeholder='Bio:'
          onChange={(e) => setbio(e.target.value)}
        />
        <button onClick={() => 
          {
            if(name.length>0 && bio.length>0){personal_info(name,bio)}
          }}>Save</button>
        <label>Help people find you easily. 
        </label>
        <label style={{maxWidth:'270px'}}>For security,profile name should ≠ username.</label>
        </div>
      </div>

    
  );
}


export default Profile;