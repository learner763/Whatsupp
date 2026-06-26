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
            else{
              set_dialog_value(
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                <label style={{fontWeight:'bold',color:'darkgreen',fontSize:'18px'}}>Duplicate Name</label>
                <label>This name is already taken!Choose Another.</label>
                <button onClick={()=>dialogref.current.close()}>Close</button>
              </div>
            )
            dialogref.current.showModal();
            }
        })        
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
        <div style={{display:'flex',flexDirection:'column',borderRadius:'20px',border:'1px green solid'}}>
        <label id='title_label'>
          <svg width="50" height="50" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <rect width="512" height="512" rx="120" fill="#0F172A"></rect>
            <path d="M100 150L150 360L256 210L362 360L412 150" fill="none" stroke="#22C55E" stroke-width="38" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg> 
           WhatsUpp
        </label>
        <label style={{margin: '10px 0px', fontSize: '22px',alignSelf:'center'}}>Create Profile</label>
        <label ><i style={{width:'21px',marginRight:'3px'}} className="fas fa-user-circle"></i> Profile Name </label>
        <input
          type="text"
          value={name}
          placeholder='Arshad_Khan'
          onChange={(e) => 
          {
            if(e.target.value.length>15){e.target.value=e.target.value.substring(0,15)}
            setname(e.target.value.replace(/[^a-zA-Z_]/g,''))} 
          }
        />
        <label ><i style={{width:'21px',marginRight:'3px'}} className="fas fa-solid fa-address-card"></i> About Me </label>
        <textarea
          type="text"
          value={bio}
          placeholder='...'
          onChange={(e) => 
            {
              if(e.target.value[0]===' '){e.target.value=e.target.value.substring(1)}
              if(e.target.value.length>50){e.target.value=e.target.value.substring(0,50)}
              setbio(e.target.value)}
            }
        >
        </textarea>
        <button id='save_button' onClick={() => 
          {
            if(name.length>0 && bio.length>0){personal_info(name,bio)}
          }}>Save</button>
        <label style={{fontWeight:'normal',alignSelf:'center'}}>Let people know you.</label>
        </div>
      </div>
      <dialog style={{borderRadius:'10px'}} ref={dialogref}>{dialog_value}</dialog>
    </>
  );
}

export default Profile;