import React, { useEffect, useState,useRef } from 'react';
import './Profile.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

function Profile() {
    const [name, setname] = useState('');
    const [bio, setbio] = useState('');
    const nav1=useNavigate();
    const [token,set_token]=useState (localStorage.getItem("token"))
    const [load1,set_load1]=useState(false)
    const [dialog_value,set_dialog_value]=useState('')
    const dialogref=useRef(null);
    function personal_info(name,bio)
    {
        let flag=false
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
            if(data[i].name===name && data[i].token!==token)
            {
                flag=true;
                set_dialog_value(
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <label style={{fontWeight:'bold',color:'darkgreen'}}>Duplicate Name</label>
                    <label>This name is already taken!Choose Another.</label>
                    <button onClick={()=>dialogref.current.close()}>Close</button>
                  </div>
                )
                dialogref.current.showModal();
            }
        }
        if(!flag)
        {
            fetch('/personal', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: token, name: name,bio:bio }),
            })
            .then(response => response.json())
            .then(data => {
                if(data.success===true)
                {
                    nav1('/home');
                }
            })
        }})
        
    }

    useEffect(()=>
    {
        if(!localStorage.getItem('logged_in')){nav1('/')}
        fetch('/user_data',
        {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({token:token})
        })
        .then(response => response.json())
        .then(data=>{
            if(data.result.length>0)
            {
                if(data.result[0].name===null){setname('')}
                else{setname(data.result[0].name);}
                if(data.result[0].bio===null){setbio('')}
                else{setbio(data.result[0].bio);}
                set_load1(true)
            }
            else{nav1('/')}
        })
    },[token])

    return (
    <>
      <div className='loader' style={{display:load1?'none':'flex'}}>
        <div className='circle'></div>
      </div>
      <div className="Profile" style={{display:load1?'flex':'none'}}>
        <div style={{display:'flex',flexDirection:'column',borderRadius:'40px',backgroundColor:'darkgreen'}}>
        <a href='https://whatsupp-feedback.vercel.app/' style={{margin:'10px',fontWeight:'bold',color:'white',alignSelf:'center'}}>View Docs</a>
        <label style={{alignSelf:'center',padding:'5px', color:'darkgreen',backgroundColor:'white',borderRadius:'5px'}}><i class="fas fa-mobile-alt"></i> WhatsUpp</label>
        <label >Profile Name 🏷️</label>
        <input
          type="text"
          value={name}
          maxLength={15}
          placeholder='Arshad_Khan'
          onChange={(e) => 
          {
            setname(e.target.value.replace(/[^a-zA-Z_]/g,''))} 
          }
        />
        <label >About Me 📝</label>
        <input
          type="text"
          value={bio}
          maxLength={25}
          placeholder='...'
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
        <label style={{fontWeight:'normal'}}>Help people find you easily.</label>
        </div>
      </div>
      <dialog style={{borderRadius:'10px'}} ref={dialogref}>{dialog_value}</dialog>
    </>
  );
}

export default Profile;