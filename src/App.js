import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios'; 
import { BrowserRouter , useNavigate } from 'react-router-dom';

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
  
  useEffect(()=>
    {if(localStorage.getItem("email")!==null && (!localStorage.getItem("root") || localStorage.getItem("root")==="false"))
    {
      console.log(6)
      nav('/home');
    }},[])
  
      async function post(email, password,bt) {
        if (email.length<13 && password.length<13)
        {
          try {
            
            const response = await axios.post('/login', {
              email: email,
              password: password,
              bt: bt
            });
            df("none");
            console.log(response)
            if(bt==="Log In")
            {
              setvisibility("block");
              if (response.data.length === 0) {
                setdisp("block");
                settext("Invalid Credentials!");
              }
              else if(response.data[0].email===email && response.data[0].password===password){
                setdisp("none");
                settext("");
                localStorage.setItem("email",email);
                localStorage.setItem('root',false)
                nav('/home');
              }
            }
            else if(bt==="Sign Up")
            {
              
              if (response.data.success===false) {
                setdisp("block");
                settext(`"${email}" already exists!`);
              }
              else if(response.data.success===true){
                setdisp("none");
                settext("");
                localStorage.setItem("email",email);
                localStorage.setItem("index",email)
                fetch("/user_in_table",{    
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ username: email })
                  }
                )
                .then(response => response.json())
                .then(data => 
                {
                  localStorage.setItem('root',false)
                  nav('/profile');
                })

              }
            }
          } 
          
          catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message); // Log any errors
          }
        }
        else{
          alert("Username and Password should be 12 characters max!");
        }
      }
      
      function forget(email)
      {
   
        fetch('/forpass', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email }),
        })
        .then(response => response.json())
        .then(data => {
          if(data.length===0)
            {
              settext(`"${email}" doesn't exist!`);
              setdisp("block");
            }
          else
            {
              settext(`Password for "${email}" : ${data[0].password}`);
              setdisp("block");
            }
        })
        .catch(error => {
          console.error('Error:', error);
        });
      }

  return (
      <div className="App" >
        <div style={{display:'flex',flexDirection:'column',borderRadius:'40px',backgroundColor:'lightgreen'}}>
        <img id="bg" src="bg.png" alt="Background" />
        <label >Username*</label>
       <input
          type="text"
          value={email}
          placeholder='Account Username:'
          onChange={(e) => setemail(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} 
        />
        <label >Password*</label>

        <input
          type="password"
          value={password}
          placeholder='Account Password:'
          onChange={(e) => setpassword(e.target.value.replace(' ',''))}
        />
        <hr style={{display:f, width: 'auto',  borderTop: "1px solid white", margin: "10px 0" }} />        
        <input placeholder='Enter Account Username:' style={{display:f}} type='text' value={email1} onChange={(e) => setemail1(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}></input>
        <button style={{display:f}} onClick={()=>forget(email1)}>Find My Password</button>
        <label style={{display:disp,maxWidth:'270px'}}>{text}</label>
        <hr style={{display:f, width: 'auto',  borderTop: "1px solid white", margin: "10px 0" }} />        
        <button onClick={() =>{ setvisibility("none") ; df("block");}}style={{display:visibility}}>Forgot Password?</button>
        <button onClick={() => 
              {
                if(email.length>0 && password.length>0){post(email,password,bt)}
              }}>{bt}
        </button> 
        <label  id="t">{msg}<label
          id="s"
          onClick={() => {
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

    
  );
}


export default App;