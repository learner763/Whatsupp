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
    const [welcome_msg,setwelcome]=useState("Sign In");
    const [f,df]=useState("none");
    const nav=useNavigate();
    const email_key=localStorage.getItem("email")
    const password_key=localStorage.getItem("password")
    const token=localStorage.getItem("token")
    const [ready,set_is_ready]=useState(false)
    const [dialog_value,set_dialog_value]=useState('')
    const dialogref=useRef(null)
    const [password_icon_content,set_content]=useState('fas fa-eye-slash')
    useEffect(()=>
    {
        let otp_inputs=document.querySelectorAll('#otp_div input');
        for (let i=0;i<otp_inputs.length;i++)
        {
            otp_inputs[i].type='number'
            otp_inputs[i].addEventListener('keydown',function(e)
            {
                if(/^[0-9]$/.test(e.key))
                {
                    e.preventDefault();
                    otp_inputs[i].value=e.key;
                    otp_inputs[i+1]?.focus();
                }
                else{
                  e.preventDefault();
                }
            })
        }
    },[dialog_value])
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
                  <label style={{fontWeight:'bold',color:'darkgreen',fontSize:'18px'}}>OTP Alert</label>
                  <label>Check {email_key} for OTP.</label>
                  <p style={{margin:'0'}}>It will be valid for 2 minutes.</p>
                  <div id='otp_div'>
                    <input></input>
                    <input></input>
                    <input></input>
                    <input></input>
                    <input></input>
                    <input></input>
                  </div>
                  <label style={{color:'red',alignSelf:'center',display:'none',fontWeight:'bold'}} id='otp_label'></label>
                  <div style={{display:'flex',justifyContent:'space-evenly',gap:'10px'}}>
                    <button style={{padding:'5px', fontSize:'16px',backgroundColor:'darkgreen',color:'white',cursor:'pointer',border:'none',borderRadius:'20px',flex:'1'}}
                    onClick={()=>
                    {
                      document.getElementById('otp_label').style.display='none';
                      let otp=`${document.querySelectorAll('#otp_div input')[0].value}${document.querySelectorAll('#otp_div input')[1].value}${document.querySelectorAll('#otp_div input')[2].value}${document.querySelectorAll('#otp_div input')[3].value}${document.querySelectorAll('#otp_div input')[4].value}${document.querySelectorAll('#otp_div input')[5].value}`;
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
                    <button style={{padding:'5px', fontSize:'16px',backgroundColor:'white',color:'darkgreen',border:'1px darkgreen solid',cursor:'pointer',borderRadius:'20px',flex:'1'}} 
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
                    <label style={{fontWeight:'bold',color:'darkgreen',fontSize:'18px'}}>OTP Alert</label>
                    <label>Check {response.data.email} for OTP.</label>
                    <p style={{margin:'0'}}>It will be valid for 2 minutes.</p>
                    <div id='otp_div'>
                      <input></input>
                      <input></input>
                      <input></input>
                      <input></input>
                      <input></input>
                      <input></input>
                    </div>
                    <label style={{color:'red',alignSelf:'center',display:'none',fontWeight:'bold'}} id='otp_label'></label>
                    <div style={{display:'flex',justifyContent:'space-evenly',gap:'10px'}}>
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'darkgreen',color:'white',cursor:'pointer',border:'none',borderRadius:'20px',flex:'1'}}
                      onClick={()=>
                      {
                        document.getElementById('otp_label').style.display='none';
                        let otp=`${document.querySelectorAll('#otp_div input')[0].value}${document.querySelectorAll('#otp_div input')[1].value}${document.querySelectorAll('#otp_div input')[2].value}${document.querySelectorAll('#otp_div input')[3].value}${document.querySelectorAll('#otp_div input')[4].value}${document.querySelectorAll('#otp_div input')[5].value}`;
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
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'white',color:'darkgreen',border:'1px darkgreen solid',cursor:'pointer',borderRadius:'20px',flex:'1'}} 
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
                    <label style={{fontWeight:'bold',color:'darkgreen',fontSize:'18px'}}>OTP Alert</label>
                    <label>Check {response.data.email} for OTP.</label>
                    <p style={{margin:'0'}}>It will be valid for 2 minutes.</p>
                    <div id='otp_div'>
                      <input></input>
                      <input></input>
                      <input></input>
                      <input></input>
                      <input></input>
                      <input></input>
                    </div>
                    <label style={{color:'red',alignSelf:'center',display:'none',fontWeight:'bold'}} id='otp_label'></label>
                    <div style={{display:'flex',justifyContent:'space-evenly',gap:'10px'}}>
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'darkgreen',color:'white',cursor:'pointer',border:'none',borderRadius:'20px',flex:'1'}}
                      onClick={()=>
                      {
                        document.getElementById('otp_label').style.display='none';
                        let otp=`${document.querySelectorAll('#otp_div input')[0].value}${document.querySelectorAll('#otp_div input')[1].value}${document.querySelectorAll('#otp_div input')[2].value}${document.querySelectorAll('#otp_div input')[3].value}${document.querySelectorAll('#otp_div input')[4].value}${document.querySelectorAll('#otp_div input')[5].value}`;
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
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'white',color:'darkgreen',border:'1px darkgreen solid',cursor:'pointer',borderRadius:'20px',flex:'1'}} 
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
                    <label style={{fontWeight:'bold',color:'darkgreen',fontSize:'18px'}}>OTP Alert</label>
                    <label>Check {data.email} for OTP.</label>
                    <p style={{margin:'0'}}>It will be valid for 2 minutes.</p>
                    <div id='otp_div'>
                      <input></input>
                      <input></input>
                      <input></input>
                      <input></input>
                      <input></input>
                      <input></input>
                    </div>
                    <label style={{color:'red',alignSelf:'center',display:'none',fontWeight:'bold'}} id='otp_label'></label>
                    <div style={{display:'flex',justifyContent:'space-evenly',gap:'10px'}}>
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'darkgreen',color:'white',cursor:'pointer',border:'none',borderRadius:'20px',flex:'1'}}
                      onClick={()=>
                      {
                        document.getElementById('otp_label').style.display='none';
                        let otp=`${document.querySelectorAll('#otp_div input')[0].value}${document.querySelectorAll('#otp_div input')[1].value}${document.querySelectorAll('#otp_div input')[2].value}${document.querySelectorAll('#otp_div input')[3].value}${document.querySelectorAll('#otp_div input')[4].value}${document.querySelectorAll('#otp_div input')[5].value}`;
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
                      <button style={{padding:'5px', fontSize:'16px',backgroundColor:'white',color:'darkgreen',border:'1px darkgreen solid',cursor:'pointer',borderRadius:'20px',flex:'1'}} 
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
        <div className='main_div' >
        <label id='title_label'><i class="fas fa-mobile-alt" style={{background: 'white',
        padding: '10px',
        color: 'green',
        borderRadius: '10px'}}></i> WhatsUpp</label>
          <label style={{margin:'10px 0px',fontSize:'20px'}}>{welcome_msg}</label>
          <label style={{alignSelf:'flex-start',margin:'10px'}}  >Email 🔑</label>
          <input
            style={{margin:'0 10px'}}
            type="text"
            value={email}
            placeholder='you@domain.tld'
            onChange={(e) => setemail(e.target.value.replace(/[^a-zA-Z0-9_.@+]/g, ''))} 
          />
          <label style={{alignSelf:'flex-start',margin:'20px 10px 10px 10px'}} >Password 🔒</label>
          <div style={{border: '1px solid #000000cc',
          borderRadius: '20px',
          paddingRight: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          margin: '0px 10px 10px 10px'}}>
            <input
              type={password_icon_content==='fas fa-eye' ? "text" : "password"}
              id='password_input'
              style={{border:'none',margin:'0'}}
              value={password}
              placeholder='********'
              maxLength={15}
              onChange={(e) => setpassword(e.target.value.replace(' ',''))}
            />
            <i style={{width:'20px',color:'#000000cc',marginLeft:'auto'}} className={password_icon_content} 
            onClick={()=>
            {
              if(password_icon_content==='fas fa-eye-slash')
              {
                set_content('fas fa-eye')
              }
              else{
                set_content('fas fa-eye-slash')
              }
            }
            }></i>
          </div>
          <hr style={{display:f, width: 'auto',  borderTop: "1px solid gray", margin: "10px" }} />        
          <input placeholder='Enter Account Email:' style={{display:f,margin:'10px'}} type='text' value={email1} 
          onChange={(e) => 
          {
            setemail1(e.target.value.replace(/[^a-zA-Z0-9_@.+]/g, ''))
          }}></input>
          <button style={{display:f}} onClick={()=>forget(email1)}>Find Account</button>
          <label style={{display:disp,color:'red',margin:'10px 0px'}}>{text}</label>
          <hr style={{display:f, width: 'auto',  borderTop: "1px solid gray", margin: "10px" }} />        
          <button onClick={() =>{ setvisibility("none") ; df("block");}}style={{display:visibility}}>Forgot Password?</button>
          <button id='login_button' onClick={() => 
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
                setwelcome("Create Account");
                setlt("Log In");
                setbt("Sign Up");
                setvisibility("none");
                df("none");
                cmsg("Signed in already?");
              }
              else{
                setwelcome("Sign In");
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
      <dialog style={{borderRadius:'20px'}} ref={dialogref}>{dialog_value}</dialog>
    </>
  );
}

export default App;