import React, {  use, useEffect, useState } from 'react';
import './Home.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import {db} from './firebase';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    doc
} from "firebase/firestore";
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
    const [selected_bar,set_selected_bar]=useState(0);
    const [usernames,set_usernames]=useState([]);
    const [innerwidth,set_innerwidth]=useState(window.innerWidth);
    let w=-1;

    function update_data()
    {
        fetch('/accounts')
        .then(response => response.json())
        .then(data=>
        {
            let accounts=[];
            let ind=[]
            let emails=[]
            for(let i=0;i<data.length;i++)
            {
                accounts.push(data[i].name);
                accounts.push(data[i].bio);
                ind.push(data[i].index)
                emails.push(data[i].email);
            }
            console.log(emails);
            set_usernames(emails);
            set_indices(ind);
            setinfo(accounts);
        })
    }
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
                .then(data => 
                {
                    addDoc(collection(db,'messages'),{
                        pre:username,
                        post:up_user,
                        createdAt: serverTimestamp()
                    })
                }
                );
                localStorage.setItem("email",up_user);
                change_username(localStorage.getItem("email")); 
                update_data();
            }
            else
            {
                alert(`"${up_user}" already exists! Please choose another username.`); 
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

    useEffect(()=>
    {
        let first_snapshot=true
        let q=query(collection(db,'messages'),orderBy('createdAt'))
        let action=onSnapshot(q,(snapshot)=>
        {
            if(first_snapshot){first_snapshot=false;return;}
            if(snapshot.docs[snapshot.docs.length-1].metadata.hasPendingWrites){return;}
            let msgs=snapshot.docs.map(function(doc)
            {
                return {...doc.data()}
            })
            console.log(msgs)
            if(!msgs[msgs.length-1].pre)
            {
                console.log('yes')
                console.log(username)
                if(msgs.length>0 && (msgs[msgs.length-1].from==username || msgs[msgs.length-1].to==username))
                {
                    console.log('again-yes')

                    let to=msgs[msgs.length-1].to;
                    let from=msgs[msgs.length-1].from;
                    let message_text=msgs[msgs.length-1].text;
                    let time=`${new Date().toDateString().replaceAll(" ",'-')}-${new Date().getHours()<13?new Date().getHours():new Date().getHours()-12}:${new Date().getMinutes()}:${new Date().getSeconds()}-${new Date().getHours()<12?"AM":"PM"}`
                    
                    console.log("hey")
                    setmessages(prev=>
                    {
                        console.log(...prev)
                        let previous=[...prev]
                        let found=0
                        for(let i=0;i<previous.length;i++)
                        {
                            if(to==from)
                            {
                                if(previous[i][0]==username)
                                {
                                    found=1
                                    console.log('me')
                                    previous[i][1].push(`Sent: ${message_text}     ${time}`);
                                    let inter=previous[i]
                                    previous.splice(i,1)
                                    previous.unshift(inter);
                                    console.log(previous)
                                    return previous;
                                }
                            }
                            else{
                                console.log('other')
                                if(from==username && previous[i][0]==to)
                                {
                                    found=1
                                    previous[i][1].push(`Sent: ${message_text}     ${time}`);
                                    let inter=previous[i]
                                    previous.splice(i,1)
                                    previous.unshift(inter);
                                    console.log(previous)
                                    return previous;
                                }
                                else if(to==username && previous[i][0]==from){
                                    found=1
                                    previous[i][1].push(`Received: ${message_text}     ${time}`);
                                    let inter=previous[i]
                                    previous.splice(i,1)
                                    previous.unshift(inter);
                                    console.log(previous)
                                    return previous;
                                }
                                
                            }
                            
                        }
                        if(found==0)
                        {
                            if(to==from){previous.unshift([from,[`Sent: ${message_text}     ${time}`]]);}
                            else if(from==username){previous.unshift([to,[`Sent: ${message_text}     ${time}`]]);}
                            else if(to==username){
                                update_data()
                                previous.unshift([from,[`Received: ${message_text}     ${time}`]]);
                            }
                            console.log('final',previous)
                            return previous;
                        }
                    }
                    );
                        
                }
            }
            else{            
                let pre=msgs[msgs.length-1].pre;
                let post=msgs[msgs.length-1].post;
                console.log('nds')
                setmessages(prev=>
                {
                    console.log('fenr')
                    let previous=[...prev]
                    console.log(usernames)
                    for(let i=0;i<previous.length;i++)
                    {
                        if(previous[i][0]==pre)
                        {
                            set_usernames(previous_array=>
                            {
                                let previous_one=[...previous_array]
                                if(previous_one.includes(pre))
                                {
                                    previous_one.splice(previous_one.indexOf(pre),1,post)
                                }
                                console.log(previous_one)
                                return previous_one
                            })
                            if(selected_bar==pre){set_selected_bar(post)}
                            previous[i][0]=post;
                        }
                    }
                    console.log(usernames)
                    console.log(previous)
                    return previous;
                })
            }
        })
        return()=>
        {
            action();
        }
    },[username])

    
    useEffect(() => {
        for(let i=0;i<3;i++)
        {
            if(getComputedStyle(document.querySelectorAll('.home11 label')[i]).color=='rgb(255, 255, 255)')
            {
                document.querySelectorAll('.home11_pro label')[i].style.color='darkgreen';
                document.querySelectorAll('.home11_pro label')[i].style.backgroundColor='white';
                document.querySelectorAll('.home11_pro label')[i].style.borderRadius='6px';
                for(let j=0;j<3;j++)
                {
                    if(j!=i)
                    {
                        document.querySelectorAll('.home11_pro label')[j].style.color='white';
                        document.querySelectorAll('.home11_pro label')[j].style.backgroundColor='darkgreen';
                    }
                }
            }
            else if(getComputedStyle(document.querySelectorAll('.home11_pro label')[i]).backgroundColor=='rgb(255, 255, 255)')
            {
                document.querySelectorAll('.home11 label')[i].style.color='white';
                document.querySelectorAll('.home11 label')[i].style.backgroundColor='darkgreen';
                for(let j=0;j<3;j++)
                {
                    if(j!=i)
                    {
                        document.querySelectorAll('.home11 label')[j].style.color='darkgreen';
                        document.querySelectorAll('.home11 label')[j].style.backgroundColor='lightgreen';
                    }
                }
            }
        }
        if(window.innerWidth<=850){
            let people=document.getElementById('people');
            console.log(window.getComputedStyle(people).color)
            if(window.getComputedStyle(people).color=='rgb(255, 255, 255)')
                {console.log("no");document.getElementsByClassName('home13')[0].style.flex=0;}
            else{console.log("yes");document.getElementsByClassName('home13')[0].style.flex=1;document.getElementsByClassName('home12')[0].style.flex=0;}
            
            for(let j=0;j<3;j++)
            {
                {
                    document.querySelectorAll('.home11 label')[j].style.color='darkgreen';
                    document.querySelectorAll('.home11 label')[j].style.backgroundColor='lightgreen';
                }
            }
            for(let i=0;i<3;i++)
                {
                    if(getComputedStyle(document.querySelectorAll('.home11 label')[i]).color=='rgb(255, 255, 255)')
                    {
                        document.querySelectorAll('.home11_pro label')[i].style.color='darkgreen';
                        document.querySelectorAll('.home11_pro label')[i].style.backgroundColor='white';
                        document.querySelectorAll('.home11_pro label')[i].style.borderRadius='6px';
                        for(let j=0;j<3;j++)
                        {
                            if(j!=i)
                            {
                                document.querySelectorAll('.home11_pro label')[j].style.color='white';
                                document.querySelectorAll('.home11_pro label')[j].style.backgroundColor='darkgreen';
                            }
                        }
                    }
                    
                }
        }
        else{
            document.getElementsByClassName('home13')[0].style.display='flex';
            document.getElementsByClassName('home13')[0].style.flex=0.25;
            document.getElementsByClassName('home12')[0].style.flex=1;
            document.getElementsByClassName('home12')[0].style.display='flex';
            for(let j=0;j<5;j++)
            {
                {
                    document.querySelectorAll('.home11_pro label')[j].style.color='white';
                    document.querySelectorAll('.home11_pro label')[j].style.backgroundColor='darkgreen';
                }
            }
            for(let i=0;i<3;i++)
                {
                    
                    if(getComputedStyle(document.querySelectorAll('.home11_pro label')[i]).backgroundColor=='rgb(255, 255, 255)')
                    {
                        document.querySelectorAll('.home11 label')[i].style.color='white';
                        document.querySelectorAll('.home11 label')[i].style.backgroundColor='darkgreen';
                        for(let j=0;j<3;j++)
                        {
                            if(j!=i)
                            {
                                document.querySelectorAll('.home11 label')[j].style.color='darkgreen';
                                document.querySelectorAll('.home11 label')[j].style.backgroundColor='lightgreen';
                            }
                        }
                    }
                }
        }
    
    },[innerwidth])
        
    useEffect(() => {
        
        let container=document.getElementsByClassName('part1');
        if(container.length>0){container[0].scrollTop = container[0].scrollHeight;}
    },[messages,selected_bar])
    useEffect(() => {
        retrieve_messages()

        window.addEventListener('resize',()=>
        {
            set_innerwidth(window.innerWidth);
        })

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
                let emails=[]
                for(let i=0;i<data.length;i++)
                {
                    accounts.push(data[i].name);
                    accounts.push(data[i].bio);
                    ind.push(data[i].index)
                    emails.push(data[i].email);
                }
                set_usernames(emails);
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
                let ind=[]
                let emails=[]
                for(let i=0;i<data.length;i++)
                {
                    accounts.push(data[i].name);
                    accounts.push(data[i].bio);
                    ind.push(data[i].index)
                    emails.push(data[i].email);
                }
                set_indices(ind);
                set_usernames(emails);
                setinfo(accounts);
            })
        })
        let phone_icons=document.querySelectorAll(".home11_pro label");
        for(let i=0;i<phone_icons.length;i++)
        {
            phone_icons[i].addEventListener('click',()=>{
            for(let j=0;j<phone_icons.length;j++)
            {
                console.log("fbd")
                phone_icons[j].style.color='white';
                phone_icons[j].style.backgroundColor='darkgreen';
                
            }   
            console.log(i)
            phone_icons[i].style.color='darkgreen';
            phone_icons[i].style.backgroundColor='white';
            phone_icons[i].style.borderRadius='6px';
            if(i==0){setpart2('none');setpart3('none');setdisp('none');set_disp_chat('flex');document.getElementsByClassName('home13')[0].style.display='none';document.getElementsByClassName('home13')[0].style.flex=0;document.getElementsByClassName('home12')[0].style.flex=1}
            if(i==1){setpart2('flex');setpart3('none');setdisp('none');set_disp_chat('none');document.getElementsByClassName('home13')[0].style.display='none';document.getElementsByClassName('home13')[0].style.flex=0;document.getElementsByClassName('home12')[0].style.flex=1}
            if(i==2){setpart2('none');setpart3('flex');setdisp('none');set_disp_chat('none');document.getElementsByClassName('home13')[0].style.display='none';document.getElementsByClassName('home13')[0].style.flex=0;document.getElementsByClassName('home12')[0].style.flex=1}
            if(i==4){setpart2('none');setpart3('none');setdisp('none');set_disp_chat('none');document.getElementsByClassName('home13')[0].style.display='flex';document.getElementsByClassName('home13')[0].style.flex=1;document.getElementsByClassName('home12')[0].style.flex=0}
            });
        }

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
        set_selected_bar(to)
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
                addDoc(collection(db,'messages'),{
                    from: from,
                    to: to,
                    text: msg,
                    createdAt: serverTimestamp()
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
                profile_name.innerHTML="<i class='fas fa-user'></i> "+connect_people[i].innerHTML;
                
                if(window.innerWidth<=850){document.getElementsByClassName('home13')[0].style.flex=0;document.getElementsByClassName('home12')[0].style.flex=1}
                else{document.getElementsByClassName('home13')[0].style.flex=0.25;document.getElementsByClassName('home12')[0].style.flex=1}
                
                setdisp("flex");
                setpart2('none');
                setpart3('none');
                set_disp_chat('none');

                document.querySelectorAll('.home11_pro label')[0].style.color='darkgreen';
                document.querySelectorAll('.home11_pro label')[0].style.backgroundColor='white';
                document.querySelectorAll('.home11_pro label')[0].style.borderRadius='6px';
                document.querySelectorAll('.home11_pro label')[4].style.color='white';
                document.querySelectorAll('.home11_pro label')[4].style.backgroundColor='darkgreen';

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
                <label><i class='fas fa-phone'></i>Whatsupp</label>
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

                    <div className='part1' style={{display:disp}} >
                        <label  id="profile_name" ><i className='fas fa-user'></i> </label>
                        {messages.map((value,index)=>
                        {
                            if(selected_bar==messages[index][0])
                            {
                                return(
                                    <div key={index} className='chat_detail' style={{display:'flex',flexDirection:'column'}} >
                                        {value[1].map((text,ind)=>
                                        (
                                            text.startsWith('Sent')?
                                            (<span style={{marginTop:'10px', alignSelf:'flex-end',backgroundColor:'darkgreen',color:'white',borderRadius:'10px',width:'300px',padding:'5px',fontSize:'20px'}}>{text.replace('Sent: ','')}</span>):
                                            (<span style={{marginTop:'10px',alignSelf:'flex-start',backgroundColor:'black',color:'white',borderRadius:'10px',width:'300px',padding:'5px',fontSize:'20px'}}>{text.replace('Received: ','')}</span>)                                               
                                        )
                                        )}
                                    </div>
                                )
                            }
                        })}
                    </div>
                    <div className='chats' style={{display:disp_chat}}>
                        <label id="connect_msg"><i class="fas fa-people-arrows"></i> Start connecting with people.</label>

                        {messages.map((value,index)=>
                            {
                                return(
                                    <div onClick={()=>{document.getElementById('profile_name').innerHTML="<i class='fas fa-user'></i> "+info[usernames.indexOf(value[0])*2];set_selected_bar(messages[index][0]);set_disp_chat('none');setdisp('flex');update_receiver(indices[usernames.indexOf(value[0])])}} className='chat_bar' key={index} style={{display:'flex',flexDirection:'column'}} >
                                        <span><i className='fas fa-user'></i> {info[usernames.indexOf(value[0])*2]}</span>
                                        <span>{value[1][value[1].length-1]}</span>
                                    </div>
                                );
                            })
                        }
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
                                    <button onClick={()=>
                                        {
                                            set_selected_bar(prev=>
                                                {
                                                    for(let i=0;i<messages.length;i++)
                                                    {
                                                        if(messages[i][0]==usernames[indices.indexOf(Number(indices[index]))])
                                                        {
                                                            return messages[i][0];
                                                        }
                                                    }
                                                })
                                        }
                                    } className='connect_buttons' data-indexid={indices[index]}><i className='fas fa-people-arrows'></i>Connect</button>
                                </div>
                            );
                        }
                        return null; 
                    })}
                </div>

            </div>
            
            <div className='msg_div' style={{display:disp}}>
                        <textarea id="message" style={{resize:"none", border:"black solid 1px",borderRadius:"5px"}} placeholder='Type...' ></textarea>
                        <button id="Send_Button" onClick={()=>Send()} style={{borderRadius:"5px",color:"white",backgroundColor:"green",border:"darkgreen solid 1px",cursor:"pointer"}} ><i class="fas fa-paper-plane"></i>Send</button>
            </div>

            <div className='home11_pro' style={{display:'none'}}>
                <label><i class='fas fa-comment-dots'></i>Chats</label>
                <label><i class='fas fa-user'></i>Profile</label>
                <label><i class='fas fa-cog'></i>Settings</label>
                <label onClick={()=>nav2('/')} ><i class='fas fa-user-plus'></i>Add Account</label>
                <label id="people"><i class='fas fa-users'></i>People</label>
            </div>
        </div>
    );
}
export default Home;
