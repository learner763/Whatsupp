import React, { use, useEffect, useState } from 'react';
import './Home.css';
import axios from 'axios'; 
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import {connect, io} from 'socket.io-client';
function Home()
{
    const [info, setinfo] = useState([]);
    const [username, change_username] = useState(localStorage.getItem("email"));
    const nav2=useNavigate();
    const [up_user,setup_user]=useState('');
    const [up_name,setup_name]=useState('');
    const [up_bio,setup_bio]=useState('');
    const [part2,setpart2]=useState('none');
    const [part3,setpart3]=useState('none');
    const [pass,setpass]=useState('')
    const [bgr,setbg]=useState('white')
    const [disp,setdisp]=useState("none")
    const [receiver,update_receiver]=useState(0);
    const [messages,setmessages]=useState([]);
    const [sent,set_sent]=useState(0);
    const [disp_chat,set_disp_chat]=useState("flex");
    const [indices,set_indices]=useState([]);
    let w=-1;

    function retrieve_messages()
    {
        fetch('/get_messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: username }),
            })
            .then(response => response.json())
            .then(data => 
                {
                    console.log(data);
                    let frontend_messages=[]
                    for(let i=0;i<data.length;i+=2)
                    {
                        frontend_messages.push([data[i],data[i+1]])
                    }
                    console.log(frontend_messages)
                    setmessages(frontend_messages);
                })
        
    }
    function update_info(up_user,up_name,up_bio)
    {
        fetch('/save_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ previous: username, username: up_user, name: up_name,bio:up_bio }),
        })
        .then(response => response.json())
        .then(data =>
        {
            if(data.success)
            {
                fetch("/message_change",
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ previous: username,username: up_user }),
                    }
                )
                .then(response => response.json())
                .then(data => console.log(data));
                localStorage.setItem("email",up_user);
                change_username(localStorage.getItem("email")); // Update the username in local storage
            }
            else
            {
                alert(`"${up_user}" already exists! Please choose another username.`); // Alert if username already exists
            }
        });
        
    }
    
    function update_settings(pass,bg)
    {
        fetch('/save_settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username, password: pass, bg: bg }),
        })
        .then(response => response.json())
        
    }
    const socket=io('/',{
        auth:{username}
    })
    useEffect(() => {
        fetch("/accounts")
        .then(response => response.json())
        .then(data => 
            {
                let accounts=[] 
                for(let i=0;i<data.length;i++)
                {
                    if(data[i].email===username)
                    {
                        fetch("/user_in_table",{    
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ username: data[i].email })
                            }
                        )
                        .then(response => response.json())
                        .then(data => 
                            {
                                console.log(data);
                                retrieve_messages();
                            })
                        }
                    }
                })
    },[username]);
    useEffect(()=>{
        retrieve_messages();
    },[sent]);    
    
    useEffect(() => {
        retrieve_messages()
        fetch("/accounts")
        .then(response => response.json())
        .then(data => 
            {
                let accounts=[] 
                for(let i=0;i<data.length;i++)
                {
                    if(data[i].email===username)
                    {
                        fetch("/user_in_table",{    
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ username: data[i].email })
                            }
                        )
                        .then(response => response.json())
                        .then(data => 
                            {
                                console.log(data);
                            })
                        
                        setup_user(data[i].email);
                        setup_name(data[i].name);
                        setup_bio(data[i].bio);
                        setpass(data[i].password);
                        setbg(data[i].bg);
                    }
                }
                let ind=[]
                for(let i=0;i<data.length;i++)
                {
                    accounts.push(data[i].name);
                    accounts.push(data[i].bio);
                    ind.push(data[i].index)
                }
                set_indices(ind);
                setinfo(accounts);
            }
        );
        let connect_msg=document.getElementById("connect_msg");
        let icons=document.querySelectorAll(".home11 label");
        let refresh_people=document.getElementById("refresh_people");
        refresh_people.addEventListener("click",function()
        {
            fetch("/accounts")
            .then(response => response.json())
            .then(data => 
            {
                let accounts=[]
                for(let i=0;i<data.length;i++)
                {
                    accounts.push(data[i].name);
                    accounts.push(data[i].bio);
                }
                setinfo(accounts);
            })
        })
        for(let i=0;i<icons.length;i++)
        {
            icons[i].addEventListener('click',()=>{
                for(let j=0;j<icons.length;j++)
                {
                    icons[j].style.backgroundColor='lightgreen';
                    icons[j].style.color='darkgreen';
                }   
                icons[i].style.backgroundColor='darkgreen';
                icons[i].style.color='white';
                if(i==0){setpart2('none');setpart3('none');setdisp('none');set_disp_chat('flex')}
                if(i==1){setpart2('flex');setpart3('none');setdisp('none');set_disp_chat('none')}
                if(i==2){setpart2('none');setpart3('flex');setdisp('none');set_disp_chat('none')}
            });
        }
        socket.on('message',({from,to,message_text})=>
        {
            console.log(`${socket.auth.username} message received ${socket.id}`);
            
        });
        return ()=>socket.off('message');
    }, []);
    
    function Send()
    {
        let message =document.getElementById("message");
        fetch("/accounts")
        .then(response => response.json())
        .then(data => 
        {
            for(let i=0;i<data.length;i++)
            {
                if(data[i].index==receiver)
                {
                    insert_msg(username,data[i].email,message.value);
                    message.value=""
                    return;
                }
            }
        })
        
    }
    
    
    function insert_msg(from,to,msg)
    {
        fetch('/save_msg',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from: from, to: to, message: msg }),
        })
        .then(response => response.json())
        .then(data=>
            {   
                console.log(data)
                socket.emit('message',{
                    from:from,
                    to:to,
                    message_text:msg
                })
                set_sent(prev=> 1+prev); 
            })
    }
    useEffect(() => {
        let connect_msg=document.getElementById("connect_msg");
        let profile_name=document.getElementById("profile_name");
        let connect_buttons=document.getElementsByClassName("connect_buttons");
        let connect_people=document.getElementsByClassName("connect_people");
        console.log(connect_people.length)
        console.log(connect_buttons.length)
        for(let i=0;i<connect_buttons.length;i++)
        {
            connect_buttons[i].addEventListener('click',()=>{
                profile_name.innerHTML=connect_people[i].innerHTML;
                setdisp("flex");
                setpart2('none');
                setpart3('none');
                set_disp_chat('none');
                let icons=document.querySelectorAll(".home11 label");
                for(let j=0;j<icons.length;j++)
                {
                    icons[j].style.backgroundColor='lightgreen';
                    icons[j].style.color='darkgreen';
                }   
                icons[0].style.backgroundColor='darkgreen';
                icons[0].style.color='white';
                update_receiver(connect_buttons[i].getAttribute('data-indexid'));
                console.log(connect_buttons[i].getAttribute('data-indexid'))
            });
        }
    }, [info]);
    return(
        <div className='home'>
            <div className='top'>
                <label>Whatsupp</label>
                <label><i class='fas fa-user'></i>{up_name}</label>
            </div>
            <div className='home1' style={{backgroundColor:bgr}} >
                <div className='home11'>
                    <label><i class='fas fa-comment-dots'></i>Chats</label>
                    <label><i class='fas fa-user'></i>Profile</label>
                    <label><i class='fas fa-cog'></i>Settings</label>
                    <label onClick={()=>nav2('/')} ><i class='fas fa-user-plus'></i>Add Account</label>

                </div>
                <div className='home12'>

                    <div className='part1'>
                        <label style={{display:disp}} id="profile_name"><i className='fas fa-user'></i></label>
                    </div>
                    <div className='chats' style={{display:disp_chat}}>
                        <label id="connect_msg"><i class="fas fa-people-arrows"></i> Start connecting with people.</label>

                        {messages.map((value,index)=>
                            {
                                return(
                                    <div className='chat_bar' key={index} style={{display:'flex',flexDirection:'column'}} >
                                        <span><i className='fas fa-user'></i> {value[0]}</span>
                                        <span>{value[1][value[1].length-1]}</span>
                                    </div>
                                );
                            })
                        }
                    </div>
                    <div className='msg_div' style={{display:disp}}>
                        <textarea id="message" style={{resize:"none", border:"black solid 1px",borderRadius:"5px"}} placeholder='Type...' ></textarea>
                        <button id="Send_Button" onClick={()=>Send()} style={{borderRadius:"5px",color:"white",backgroundColor:"green",border:"darkgreen solid 1px",cursor:"pointer"}} ><i class="fas fa-paper-plane"></i>Send</button>
                        <button id="File_Button" style={{borderRadius:"5px",color:"white",backgroundColor:"green",border:"darkgreen solid 1px",cursor:"pointer"}} ><i class="fas fa-file"></i>File</button>
                    </div>
                    <div className='part2' style={{display:part2}} >
                        <i style={{alignSelf:'center'}} class='fas fa-user'></i>
                        <label>Username</label>
                        <input onChange={(e)=>setup_user(e.target.value)} value={up_user} style={{alignSelf:'end'}}></input>
                        <label>Name</label>
                        <input onChange={(e)=>setup_name(e.target.value)} value={up_name} style={{alignSelf:'end'}}></input>
                        <label>About</label>
                        <input onChange={(e)=>setup_bio(e.target.value)} value={up_bio} style={{alignSelf:'end'}}></input>
                        <button onClick={()=>update_info(up_user,up_name,up_bio)} id="save">Save</button>
                    </div>
                    
                    <div className='part3' style={{display:part3}} >
                        <i style={{alignSelf:'center'}} class='fas fa-user'></i>
                        <label>Change Password</label>
                        <input onChange={(e)=>setpass(e.target.value)} value={pass} style={{alignSelf:'end'}}></input>
                        <label>Background Theme</label>
                        <select value={bgr} style={{ alignSelf:'end'}} onChange={(e)=>setbg(e.target.value)} >
                            <option style={{color:"white"}} value="white">White</option>
                            <option style={{color:"gold"}} value="gold">Gold</option>
                            <option style={{color:"lime"}} value="lime">Lime</option>
                            <option style={{color:"orange"}} value="orange">Orange</option>
                            <option style={{color:"pink"}} value="pink">Pink</option>
                        </select>
                        <button onClick={()=>update_settings(pass,bgr)} id="save">Save</button>
                    </div>
                </div>
                
                <div className='home13' >
                    <span id="youmayknow" style={{fontWeight:'bold', display:'flex', justifySelf:'center', alignSelf:'center',color:'darkgreen'}}><i id="refresh_people" class="fas fa-sync"></i>People you may know!</span>
                    {info.map((a, index) => {
                        if (index < info.length / 2) {
                            w = w + 1; // Increment w before returning
                            return (
                                <div className='userinfo' key={index} > 
                                    <i className='fas fa-user'>{info[index + w ]=== up_name ? " You": ""}</i>                                    
                                    <span className='connect_people' >{info[index + w ]}</span> 
                                    <span style={{fontWeight:'normal'}}>{info[index + w + 1]}</span>
                                    <button className='connect_buttons' data-indexid={indices[index]}><i className='fas fa-people-arrows'></i>Connect</button>
                                </div>
                            );
                        }
                        return null; // Return null if the condition is not met
                    })}
                </div>

            </div>
        </div>
    );
}
export default Home;
