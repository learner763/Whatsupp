import React, { use, useEffect, useState } from 'react';
import './Home.css';
import axios from 'axios'; 
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
function Home()
{
    const [info, setinfo] = useState([]);
    let username = localStorage.getItem("email");
    const nav2=useNavigate();
    const [up_user,setup_user]=useState('');
    const [up_name,setup_name]=useState('');
    const [up_bio,setup_bio]=useState('');
    const [part1,setpart1]=useState('flex');
    const [part2,setpart2]=useState('none');
    const [part3,setpart3]=useState('none');
    const [pass,setpass]=useState('')
    const [bgr,setbg]=useState('white')
    const [disp,setdisp]=useState("none")

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
                localStorage.setItem("email",up_user);
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
                        setup_user(data[i].email);
                        setup_name(data[i].name);
                        setup_bio(data[i].bio);
                        setpass(data[i].password);
                        setbg(data[i].bg);
                        console.log(data[i].bg)
                        console.log(bgr)
                        
                    }
                }
                for(let i=0;i<data.length;i++)
                {
                    accounts.push(data[i].name);
                    
                    
                }
                setinfo(accounts);

            }
        );
        let icons=document.querySelectorAll(".home11 label");
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
                if(i==0){setpart1('flex');setpart2('none');setpart3('none');}
                if(i==1){setpart1('none');setpart2('flex');setpart3('none');}
                if(i==2){setpart1('none');setpart2('none');setpart3('flex');}
            });
        }
        
    }, []);
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
                setdisp("block");
                connect_msg.style.display='none';
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

                    <div className='part1' style={{display:part1}}>
                        <label style={{alignSelf:'center'}} id="connect_msg"><i class="fas fa-people-arrows"></i> Start connecting with people.</label>
                        <label style={{display:disp}} id="profile_name"></label>
                        <label style={{alignSelf:'center',display:disp}}><input style={{width:"200px", border:"black solid 1px",borderRadius:"5px"}} placeholder='Type...' ></input><button style={{borderRadius:"5px",color:"white",backgroundColor:"darkgreen",border:"darkgreen solid 1px",cursor:"pointer"}} >Send</button></label>
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
                            <option style={{color:"black"}} value="black">Black</option>
                            <option style={{color:"red"}} value="red">Red</option>
                            <option style={{color:"yellowgreen"}} value="yellowgreen">YellowGreen</option>
                            <option style={{color:"blue"}} value="blue">Blue</option>
                            <option style={{color:"lime"}} value="lime">Lime</option>
                            <option style={{color:"goldenrod"}} value="goldenrod">Goldenrod</option>
                            <option style={{color:"purple"}} value="purple">Purple</option>
                            <option style={{color:"orange"}} value="orange">Orange</option>
                            <option style={{color:"pink"}} value="pink">Pink</option>

                        </select>
                        <button onClick={()=>update_settings(pass,bgr)} id="save">Save</button>
                    </div>
                </div>
                
                <div className='home13' >
                    <span id="youmayknow" style={{fontWeight:'bold', display:'flex', justifySelf:'center', alignSelf:'center',color:'darkgreen'}}>People you may know!</span>
                    {info.reverse().map((a,index) => {
                        if (index < info.length) {
                            return (
                                <div className='userinfo' key={index}> 
                                    <i className='fas fa-user'></i> 
                                    <span className='connect_people'>{info[info.indexOf(a)]}</span> 
                                    <button className='connect_buttons' ><i className='fas fa-people-arrows'></i>Connect</button>
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
