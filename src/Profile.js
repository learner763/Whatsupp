import React, { useEffect, useState } from 'react';
import './Profile.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

function Profile() {
  const [name, setname] = useState('');
  const [bio, setbio] = useState('');
  const nav1=useNavigate();
  const [email_key,set_email_key]=useState(localStorage.getItem("email"))
  const [proceed,set_proceed]=useState('none')
  const [load1,set_load1]=useState(false)
    useEffect(()=>
    {
      if(!localStorage.getItem("email")){set_proceed('none');alert('Please register yourself first!');nav1('/')}
      else{set_proceed('flex')}
    },[email_key])
    function personal_info(name,bio)
    {
      let flag=false
      if(name.length<13 && bio.length<21)
      {
        fetch("/accounts",
        {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({test:'test'})
        })
        .then(response => response.json())
        .then(data=>{
          for(let i=0;i<data.length;i++)
          {
            if(data[i].name===name && data[i].email!==email_key)
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
              body: JSON.stringify({ username: email_key, name: name,bio:bio }),
            })
            .then(response => response.json())
            .then(data => {
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
          if(data[i].email===email_key)
          {
            if(data[i].name===null){data[i].name=''}
            else{setname(data[i].name);}
            if(data[i].bio===null){data[i].bio=''}
            else{setbio(data[i].bio);}
            set_load1(true)
            break
          }
        }
      })
    },[email_key]
    )
      
      

  
  return (
      <div className="Profile" style={{display:load1?proceed:'none'}}>
        <div style={{display:'flex',flexDirection:'column',borderRadius:'40px',backgroundColor:'lightgreen'}}>
        <a href='https://github.com/learner763/Whatsupp/#readme' style={{margin:'10px',fontWeight:'bold',color:'darkgreen',alignSelf:'center'}}>View Docs</a>
        <label style={{padding:'5px', color:'white',backgroundColor:'darkgreen',borderRadius:'5px'}}><i class="fas fa-mobile-alt"></i> WhatsUpp</label>
        <label >Profile Name 🏷️</label>
       <input
          type="text"
          value={name}
          placeholder='Name:'
          onChange={(e) => 
          {
            if(e.target.value[0]===' '){e.target.value=e.target.value.substring(1)}
            setname(e.target.value.replace(/[^a-zA-Z0-9_]/g,''))} 
          }
        />
        <label >About Me 📝</label>

        <input
          type="text"
          value={bio}
          placeholder='Bio:'
          onChange={(e) => 
            {
              if(e.target.value[0]===' '){e.target.value=e.target.value.substring(1)}
              setbio(e.target.value)}
            }
        />
        <button onClick={() => 
          {
            if(name.length>0 && bio.length>0){personal_info(name,bio)}
          }}>Save</button>
        <label>Help people find you easily. 
        </label>
        <label style={{maxWidth:'270px'}}>For security,keep profile name & username different.</label>
        </div>
      </div>

    
  );
}


export default Profile;