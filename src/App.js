import React, { useEffect, useState,useRef } from 'react';
import './App.css';
import axios from 'axios'; 
import { BrowserRouter , useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

function App() {
    const [email, setemail] = useState('');
    const [email1, setemail1] = useState('');
    const [password, setpassword] = useState('');
    const [lt, setlt] = useState('Sign Up');
    const [bt, setbt] = useState('Log In');
    const [disp,setdisp]=useState("none");
    const [text,settext]=useState("");
    const [visibility,setvisibility]=useState("block");
    const [msg,cmsg]=useState("New to this app?");
    const [f,df]=useState("none");
    const nav=useNavigate();
    const email_key=localStorage.getItem("email")
    const password_key=localStorage.getItem("password")
    const token=localStorage.getItem("token")
    const [ready,set_is_ready]=useState(false)
    const [dialog_value,set_dialog_value]=useState('')
    const dialogref=useRef(null)
    useEffect(()=>
    {
        fetch("/user_data",
        {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({email:email_key,token:token})
        })
        .then(response=>response.json())
        .then(data=>
        {
            let found=0
            if(data.result.length>0)
            {
                found=1
                setemail(data.result[0].email)
                setpassword(password_key?password_key:'')
            }
            if(!found)
            {
                setemail('')
                setpassword('')
            }
            if(email_key)
            {
              set_dialog_value(
                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                  <label style={{fontWeight:'bold',color:'darkgreen'}}>OTP Alert</label>
                  <label>Check {email_key} for OTP</label>
                  <input id='otp' type='number' style={{padding:'3px', fontSize:'16px',border:'1px black solid',borderRadius:'5px'}}></input>
                  <label style={{color:'red',alignSelf:'center',display:'none',fontWeight:'bold'}} id='otp_label'></label>
                  <div style={{display:'flex',justifyContent:'space-evenly',gap:'10px'}}>
                    <button style={{padding:'5px', fontSize:'16px',backgroundColor:'darkgreen',color:'white',cursor:'pointer',border:'none',borderRadius:'5px',fontWeight:'bold',flex:'1'}}
                    onClick={()=>
                    {
                      document.getElementById('otp_label').style.display='none';
                      let otp=document.getElementById('otp').value;
                      fetch("/verify_otp",{
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: email_key,otp:otp })
                      })
                      .then(response => response.json())
                      .then(data_again => 
                      {
                        if(data_again.success)
                        {
                          document.getElementById('otp_label').style.display='none';
                          localStorage.removeItem('password');
                          localStorage.removeItem('email');
                          localStorage.setItem('logged_in',true);
                          localStorage.setItem('token',data_again.token);
                          if(!data.log_in)
                          {
                            fetch("/user_in_table",{    
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ email: email_key })
                            })
                            .then(response => response.json())
                            .then(data => 
                            {
                              nav('/profile');
                            })
                          }
                          else{
                            nav('/home');
                          }
                        }
                        else{
                          document.getElementById('otp_label').style.display='block';
                          document.getElementById('otp_label').innerText=data_again.invalid?"Incorrect OTP!":"OTP Expired!";
                        }
                      })
                    }
                    }>Submit</button>
                    <button style={{padding:'5px', fontSize:'16px',backgroundColor:'white',color:'darkgreen',border:'1px darkgreen solid',cursor:'pointer',borderRadius:'5px',fontWeight:'bold',flex:'1'}} 
                    onClick={()=>dialogref.current.close()
                    }>Close</button>
                  </div>
                </div>

              )
              dialogref.current.showModal()
            }
            set_is_ready(true)
        })
    },[])
    
    async function post(email, password,bt) 
    {
        
        try{
        const response = await axios.post('/login', {
            email: email,
            password: password,
            bt: bt,
            token: token
        });
        df("none");
        if(bt==="Log In")
        {
            console.log(response)
            setvisibility("block");
            if (!response.data.success) {
                setdisp("block");
                settext("Invalid Credentials!");
            }
            else if(response.data.verified){
                setdisp("none");
                settext("");
                localStorage.removeItem('email')
                localStorage.removeItem('password')
                localStorage.setItem("logged_in",true);                    
                localStorage.setItem("token",response.data.token);                    
                nav('/home');
            }
            else if(!response.data.verified)
            {
                setdisp("none");
                settext("");
                localStorage.setItem('password',response.data.password);
                localStorage.setItem('email',response.data.email)
                set_dialog_value(
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <label style={{fontWeight:'bold',color:'darkgreen'}}>OTP Alert</label>
                    <label>Check {response.data.email} for OTP</label>
                    <input id='otp' type='number' style={{padding:'3px', fontSize:'16px',border:'1px black solid',borderRadius:'5px'}}></input>
                    <label style={{color:'red',alignSelf:'center',display:'none',fontWeight:'bold'}} id='otp_label'></label>
                    <div style={{display:'flex',justifyContent:'space-evenly',gap:'10px'}}>
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'darkgreen',color:'white',cursor:'pointer',border:'none',borderRadius:'5px',fontWeight:'bold',flex:'1'}}
                      onClick={()=>
                      {
                        document.getElementById('otp_label').style.display='none';
                        let otp=document.getElementById('otp').value;
                        fetch("/verify_otp",{
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ email: response.data.email,otp:otp })
                        })
                        .then(response => response.json())
                        .then(data => 
                        {
                          if(data.success)
                          {
                            document.getElementById('otp_label').style.display='none';
                            localStorage.removeItem('password');
                            localStorage.removeItem('email');
                            localStorage.setItem('token',data.token);
                            localStorage.setItem('logged_in',true);
                            nav('/home');
                          }
                          else{
                            document.getElementById('otp_label').style.display='block';
                            document.getElementById('otp_label').innerText=data.invalid?"Incorrect OTP!":"OTP Expired!";
                          }
                        })
                      }
                      }>Submit</button>
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'white',color:'darkgreen',border:'1px darkgreen solid',cursor:'pointer',borderRadius:'5px',fontWeight:'bold',flex:'1'}} 
                      onClick={()=>dialogref.current.close()
                      }>Close</button>
                    </div>
                  </div>

                )
                dialogref.current.showModal()
            }
        }
        else if(bt==="Sign Up")
        {
            if (response.data.success===false) {
                setdisp("block");
                if(response.data.duplicate){settext(`Email already exists!`);}
                else if(response.data.invalid){settext(`Invalid Email!`);}
            }
            else if(response.data.success===true){
                setdisp("none");
                settext("");
                localStorage.setItem('password',response.data.password);
                localStorage.setItem('email',response.data.email)
                set_dialog_value(
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <label style={{fontWeight:'bold',color:'darkgreen'}}>OTP Alert</label>
                    <label>Check {response.data.email} for OTP</label>
                    <input id='otp' type='number' style={{padding:'3px', fontSize:'16px',border:'1px black solid',borderRadius:'5px'}}></input>
                    <label style={{color:'red',alignSelf:'center',display:'none',fontWeight:'bold'}} id='otp_label'></label>
                    <div style={{display:'flex',justifyContent:'space-evenly',gap:'10px'}}>
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'darkgreen',color:'white',cursor:'pointer',border:'none',borderRadius:'5px',fontWeight:'bold',flex:'1'}}
                      onClick={()=>
                      {
                        document.getElementById('otp_label').style.display='none';
                        let otp=document.getElementById('otp').value;
                        fetch("/verify_otp",{
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ email: response.data.email,otp:otp })
                        })
                        .then(response => response.json())
                        .then(data => 
                        {
                          if(data.success)
                          {
                            localStorage.removeItem('password');
                            localStorage.removeItem('email');
                            localStorage.setItem('token',data.token);
                            localStorage.setItem('logged_in',true);
                            fetch("/user_in_table",{    
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ email: response.data.email })
                            })
                            .then(response => response.json())
                            .then(data => 
                            {
                              nav('/profile');
                            })
                          }
                          else{
                            document.getElementById('otp_label').style.display='block';
                            document.getElementById('otp_label').innerText=data.invalid?"Incorrect OTP!":"OTP Expired!";
                          }
                        })
                      }
                      }>Submit</button>
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'white',color:'darkgreen',border:'1px darkgreen solid',cursor:'pointer',borderRadius:'5px',fontWeight:'bold',flex:'1'}} 
                      onClick={()=>dialogref.current.close()
                      }>Close</button>
                    </div>
                  </div>

                )
                dialogref.current.showModal()
            }
        }} 
      catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message); // Log any errors
      }
        
    }
      
    function forget(email)
    {
        fetch('/forpass', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email,token:token }),
        })
        .then(response => response.json())
        .then(data => {
          if(!data.success)
          {
              settext(`Account doesn't exist!`);
              setdisp("block");
          }
          else 
          {
              if(data.token)
              {
                  setdisp("none");
                  localStorage.setItem("token",data.token);
                  localStorage.setItem("logged_in",true);
                  localStorage.removeItem('email')
                  localStorage.removeItem('password')
                  nav('/home');
              }
              else{
                setdisp("none");
                settext("");
                localStorage.setItem('email',data.email)
                set_dialog_value(
                  <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                    <label style={{fontWeight:'bold',color:'darkgreen'}}>OTP Alert</label>
                    <label>Check {data.email} for OTP</label>
                    <input id='otp' type='number' style={{padding:'3px', fontSize:'16px',border:'1px black solid',borderRadius:'5px'}}></input>
                    <label style={{color:'red',alignSelf:'center',display:'none',fontWeight:'bold'}} id='otp_label'></label>
                    <div style={{display:'flex',justifyContent:'space-evenly',gap:'10px'}}>
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'darkgreen',color:'white',cursor:'pointer',border:'none',borderRadius:'5px',fontWeight:'bold',flex:'1'}}
                      onClick={()=>
                      {
                        document.getElementById('otp_label').style.display='none';
                        let otp=document.getElementById('otp').value;
                        fetch("/verify_otp",{
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ email: data.email,otp:otp })
                        })
                        .then(response => response.json())
                        .then(data => 
                        {
                          if(data.success)
                          {
                            document.getElementById('otp_label').style.display='none';
                            localStorage.removeItem('password');
                            localStorage.removeItem('email');
                            localStorage.setItem('token',data.token);
                            localStorage.setItem('logged_in',true);
                            nav('/home');
                          }
                          else{
                            document.getElementById('otp_label').style.display='block';
                            document.getElementById('otp_label').innerText=data.invalid?"Incorrect OTP!":"OTP Expired!";
                          }
                        })
                      }
                      }>Submit</button>
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'white',color:'darkgreen',border:'1px darkgreen solid',cursor:'pointer',borderRadius:'5px',fontWeight:'bold',flex:'1'}} 
                      onClick={()=>dialogref.current.close()
                      }>Close</button>
                    </div>
                  </div>

                )
                dialogref.current.showModal()
              }
          }
        })
    }


  return (
    <>
      <div className='loader' style={{display:ready===false?'flex':'none'}}>
        <div className='circle'></div>
      </div>
      <div className="App" style={{display:ready===true?'flex':'none'}}>
        <div style={{display:'flex',flexDirection:'column',borderRadius:'40px',backgroundColor:'darkgreen'}}>
        <a href='https://whatsupp-feedback.vercel.app/' style={{margin:'10px',fontWeight:'bold',color:'white',alignSelf:'center'}}>View Docs</a>
        <label style={{padding:'5px', color:'darkgreen',backgroundColor:'white',borderRadius:'5px'}}><i class="fas fa-mobile-alt"></i> WhatsUpp</label>
        <label style={{alignSelf:'flex-start'}}  >Email 🔑</label>
        <input
          type="text"
          value={email}
          placeholder='you@domain.tld'
          onChange={(e) => setemail(e.target.value.replace(/[^a-zA-Z0-9_.@+]/g, ''))} 
        />
        <label style={{alignSelf:'flex-start'}} >Password 🔒</label>
        <input
          type="password"
          value={password}
          placeholder='********'
          maxLength={15}
          onChange={(e) => setpassword(e.target.value.replace(' ',''))}
        />
        <hr style={{display:f, width: 'auto',  borderTop: "1px solid white", margin: "10px 0" }} />        
        <input placeholder='Enter Account Email:' style={{display:f}} type='text' value={email1} 
        onChange={(e) => 
        {
          setemail1(e.target.value.replace(/[^a-zA-Z0-9_@.+]/g, ''))
        }}></input>
        <button style={{display:f}} onClick={()=>forget(email1)}>Find Account</button>
        <label style={{display:disp,maxWidth:'270px'}}>{text}</label>
        <hr style={{display:f, width: 'auto',  borderTop: "1px solid white", margin: "10px 0" }} />        
        <button onClick={() =>{ setvisibility("none") ; df("block");}}style={{display:visibility}}>Forgot Password?</button>
        <button onClick={() => 
              {
                setdisp('none')
                if(email.length>0 && password.length>0){post(email,password,bt)}
              }}>{bt}
        </button> 
        <label  id="t">{msg}<label
          id="s"
          onClick={() => {
            setdisp('none');
            setemail('');
            setpassword('');
            if (lt==="Sign Up"){
              setlt("Log In");
              setbt("Sign Up");
              setvisibility("none");
              df("none");
              cmsg("Signed in already?");
            }
            else{
              setlt("Sign Up");
              setbt("Log In");
              df("none");
              setvisibility("block");
              cmsg("New to this app?");
            }
          }}
        >
          {lt}
        </label></label>
        </div>
      </div>
      <dialog style={{borderRadius:'10px'}} ref={dialogref}>{dialog_value}</dialog>
    </>
  );
}

export default App;