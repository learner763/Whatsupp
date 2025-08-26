import React, {  useEffect, useRef, useState } from 'react';
import './Home.css';
import { BrowserRouter ,  useNavigate } from 'react-router-dom';
import {db} from './firebase';
import { real_time_db } from './firebase';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    where,
    getDocs,
    updateDoc,
    doc
    
} from "firebase/firestore";
import{
    onDisconnect,set,ref,onValue,
    update
} from "firebase/database";
function Home()
{
    const [info, setinfo] = useState([]);
    const [username, change_username] = useState(localStorage.getItem("email"));
    const [profile, change_profile] = useState(localStorage.getItem("profile"));
    const [index,change_index]=useState(localStorage.getItem('index'))
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
    const [disp_chat,set_disp_chat]=useState("flex");
    const [indices,set_indices]=useState([]);
    const [innerwidth,set_innerwidth]=useState(window.innerWidth);
    const [status,set_status]=useState([]);
    const current_timeout=useRef(null)
    const [refreshed,set_refresh]=useState(false);
    const [loaded,set_loaded]=useState(false)
    let w=-1;

    async function set_seen()
    {
        console.log('dekh')
        let entries=query(collection(db,'messages'),where("to","==",index),where("from","==",receiver),where("seen","==",false));
        const snapshot=await getDocs(entries);
        snapshot.forEach(async (doc)=>
        {
            await updateDoc(doc.ref,{seen:true})
        })
    }   
    function update_data()
    {
        let ind=[]
        let accounts=[]
        fetch('/accounts')
        .then(responce=>responce.json())
        .then(data=>
        {
            for(let i=0;i<data.length;i++)
            {
                ind.push(data[i].index)
                accounts.push(data[i].name)
                accounts.push(data[i].bio)
            }
            set_indices(ind)
            setinfo(accounts)
        }
        )
    }
    function retrieve_messages(you)
    {
        fetch('/get_messages',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username:you }),
            })
            .then(response => response.json())
            .then(data => 
                {
                    if(data.error){}
                    else{
                        let frontend_messages=[]
                        for(let i=0;i<data.length;i+=2)
                        {
                            frontend_messages.push([data[i],data[i+1]])
                        }
                        setmessages(frontend_messages);
                        set_refresh(true)
                    }
                })
        
    }
    function update_info(up_user,up_name,up_bio)
    {        
        fetch('/save_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ previous: username, username: up_user,profile:profile, name: up_name,bio:up_bio }),
        })
        .then(response => response.json())
        .then(data =>
        {
            console.log(data)
            if(data.success===true)
            {
                localStorage.setItem("email",up_user);
                localStorage.setItem('profile',up_name)
                change_username(localStorage.getItem("email")); 
                change_profile(localStorage.getItem('profile'))
            }
            else if(data.success===false)
            {
                if(data.person===false && data.user===true)
                {
                    localStorage.setItem("email",up_user);
                    change_username(localStorage.getItem("email")); 
                    alert(data.msg);
                }
                else if(data.person===true && data.user===false)
                {
                    localStorage.setItem('profile',up_name)
                    change_profile(localStorage.getItem('profile'))
                    alert(data.msg);
                }
                else
                {
                    alert(data.msg); 
                }
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

    function typing_status()
    {
        let online_status=ref(real_time_db,`online_status/${index}`);
        update(online_status,{
            typing:true,
            recipient:receiver
        })
        if(current_timeout.current)
        {
            clearTimeout(current_timeout.current)
        }
        current_timeout.current=setTimeout(()=>
        {
            update(online_status,{
                typing:false,
                recipient:''
            })
        },2000)
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
                return {id:doc.id,...doc.data()}
            })
            
                if(msgs.length>0 && (msgs[msgs.length-1].from==index || msgs[msgs.length-1].to==index))
                {
                    let to=msgs[msgs.length-1].to;
                    let from=msgs[msgs.length-1].from;
                    let message_text=msgs[msgs.length-1].text;
                    let time=msgs[msgs.length-1].createdAt.toDate().toISOString();                    
                    setmessages(prev=>
                    {
                        let previous=[...prev]
                        let found=0
                        for(let i=0;i<previous.length;i++)
                        {
                            if(to===from)
                            {
                                if(previous[i][0]===index)
                                {
                                    found=1
                                    if(previous[i][1].includes(`✔✔✔✔ ${message_text}     ${time}`)!=true && previous[i][1].includes(`✔✔ ${message_text}     ${time}`)!=true){previous[i][1].push(`✔✔ ${message_text}     ${time}`);}
                                    else{return previous;}
                                    let inter=previous[i]
                                    previous.splice(i,1)
                                    previous.unshift(inter);
                                    return previous;
                                }
                            }
                            else{
                                if(from==index && previous[i][0]==to)
                                {
                                    found=1
                                    if(previous[i][1].includes(`✔✔✔✔ ${message_text}     ${time}`)!=true && previous[i][1].includes(`✔✔ ${message_text}     ${time}`)!=true){previous[i][1].push(`✔✔ ${message_text}     ${time}`)}
                                    else{return previous;}                                    
                                    let inter=previous[i]
                                    previous.splice(i,1)
                                    previous.unshift(inter);
                                    return previous;
                                }
                                else if(to==index && previous[i][0]==from){
                                    found=1
                                    if(previous[i][1].includes(` ${message_text}     ${time}`)==false){previous[i][1].push(` ${message_text}     ${time}`);}
                                    else{return previous;}
                                    let inter=previous[i]
                                    previous.splice(i,1)
                                    previous.unshift(inter);
                                    return previous;
                                }
                                
                            }
                            
                        }
                        if(found==0)
                        {
                            console.log(9)
                            if(to==from){previous.unshift([from,[`✔✔ ${message_text}     ${time}`]]);}
                            else if(from==index){previous.unshift([to,[`✔✔ ${message_text}     ${time}`]]);}
                            else if(to==index){
                                update_data()
                                previous.unshift([from,[` ${message_text}     ${time}`]]);
                            }
                            return previous;
                        }
                    }
                    );
                        
                }
            console.log(msgs)
            
        })
        return()=>
        {
            action();
        }
    },[])

    useEffect(()=>
    {
        if(index.length<1 || indices.includes(index)===false){return;}
        let online_status=ref(real_time_db,`online_status/${index}`);
        
        set(online_status,{
            online:true,
            lastseen:new Date().toISOString()
        })
        onDisconnect(online_status).update(
        {
            online:false,
            lastseen:new Date().toISOString()
        }
        )
        
        
        let online_users=ref(real_time_db,'/online_status')
        onValue(online_users,(snapshot)=>
        {
            let active_users=snapshot.val()
            let statuses=[]
            
            for(let i=0;i<indices.length;i++)
            {
                if(Object.keys(active_users).includes(indices[i] ))
                {
                    if(active_users[indices[i]].online)
                    {
                        if(active_users[indices[i]].typing && active_users[indices[i]].recipient===index)
                        {
                            statuses.push('(Typing...)')
                        }
                        else{
                            statuses.push('(Online)')
                        }
                    }
                    else if(active_users[indices[i]].lastseen && active_users[indices[i]].online==false){
                        statuses.push(new Date(active_users[indices[i]].lastseen).toLocaleDateString()
                        .slice(new Date(active_users[indices[i]].lastseen).toLocaleDateString().indexOf('/')+1,
                        new Date(active_users[indices[i]].lastseen).toLocaleDateString().lastIndexOf('/')
                        ).includes(new Date().getDate())?new Date(active_users[indices[i]].lastseen).toLocaleTimeString():
                        new Date(active_users[indices[i]].lastseen).toLocaleDateString())
                        }
                }
                else{statuses.push('')}

            }
            set_status(statuses)
        })
        return()=>
        {
            set(online_status,{
                online:false,
                lastseen:new Date().toISOString()
            })
        }
    },[indices,index])

        
    useEffect(()=>
    {
        if( index.length<1 || indices.includes(index)===false ){return;}
    
        let unseen_messages=query(collection(db,'messages'),where("to","==",index),where("seen","==",false))
        let seen=onSnapshot(unseen_messages,(snapshot)=>
        {
            let msgs=snapshot.docs.map(function(doc)
            {
                return {id:doc.id,...doc.data()}
            })
            
            setmessages(prev=>
                {
                    let previous=[...prev]
                    console.log(previous.length)
                    for(let i=0;i<previous.length;i++)
                    {
                        let count=0
                        for(let j=0;j<msgs.length;j++)
                        {
                            if(previous[i][0]===msgs[j].from && previous[i][0]!==index)
                            {
                                if(msgs[j].seen===false)
                                {
                                    if(receiver!==msgs[j].from)
                                    {console.log('hey'); count+=1}
                                    else{
                                        let msgref=doc(db,'messages',msgs[j].id)
                                        updateDoc(msgref,{seen:true})
                                    }
                                }
                            } 
                        }
                        previous[i][2]=count
                    }
                    return previous
                })
        })

        let tick_messages=query(collection(db,'messages'),where("from","==",index))
        let ticked=onSnapshot(tick_messages,(snapshot)=>
        {
            let msgs=snapshot.docs.map(function(doc)
            {
                return {id:doc.id,...doc.data()}
            })
            setmessages(prev=>
                {
                    let previous=prev.map(m=> [...m]) 
                    console.log('seeen')
                    console.log(previous.length)
                    for(let i=0;i<previous.length;i++)
                    {
                        for(let j=0;j<msgs.length;j++)
                        {
                            if(previous[i][0]=== msgs[j].to)
                            {
                                for(let k=0;k<previous[i][1].length;k++)
                                {
                                    if(previous[i][1][k].startsWith('✔✔✔✔')===false)
                                    {
                                        if(previous[i][1][k].slice(previous[i][1][k].indexOf(' ')+1,previous[i][1][k].lastIndexOf(" ")-4)===msgs[j].text)
                                        {
                                            if(msgs[j].seen===true)
                                            {
                                                previous[i][1][k]=`✔✔${previous[i][1][k]}`
                                                
                                            }
                                        }
                                    }
                                }
                                
                            }
                            
                        }
                        
                    }
                    console.log(previous)
                    return previous
                })
                set_loaded(true)
        })
        return()=>
        {
            seen();
            ticked();
        }
    },[indices,index,receiver,refreshed])
    
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
        if(window.innerWidth<=1100){
            let people=document.getElementById('people');
            if(window.getComputedStyle(people).color=='rgb(255, 255, 255)')
                {document.getElementsByClassName('home13')[0].style.flex=0;}
            else{document.getElementsByClassName('home13')[0].style.flex=1;document.getElementsByClassName('home12')[0].style.flex=0;}
            
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
            document.getElementsByClassName('home13')[0].style.flex=0.5;
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
    },[messages,receiver])
    useEffect(() => {
        window.addEventListener('resize',()=>
        {
            set_innerwidth(window.innerWidth);
        })

        fetch("/accounts")
        .then(response => response.json())
        .then(data => 
            {
                let accounts=[] 
                let flag=false
                for(let i=0;i<data.length;i++)
                {
                    if(data[i].email===username)
                    {
                        localStorage.setItem('profile',data[i].name)
                        localStorage.setItem('index',data[i].index)
                        change_profile(localStorage.getItem('profile'))
                        change_index(localStorage.getItem('index'))
                        retrieve_messages(data[i].index)
                        flag=true
                        setup_user(data[i].email);
                        setup_name(data[i].name);
                        setup_bio(data[i].bio);
                        setpass(data[i].password);
                        setbg(data[i].bg);
                    }
                }
                if(flag==false){set_loaded(false);alert(`No account exists with "${username}"`)}
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
                for(let i=0;i<data.length;i++)
                {
                    accounts.push(data[i].name);
                    accounts.push(data[i].bio);
                    ind.push(data[i].index)
                }
                set_indices(ind);
                setinfo(accounts);
            })
        })
        let phone_icons=document.querySelectorAll(".home11_pro label");
        for(let i=0;i<phone_icons.length;i++)
        {
            phone_icons[i].addEventListener('click',()=>{
                update_receiver(0)
            for(let j=0;j<phone_icons.length;j++)
            {   
                phone_icons[j].style.color='white';
                phone_icons[j].style.backgroundColor='darkgreen';
                
            }   
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
                update_receiver(0)
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
        console.log(receiver)
        let message =document.getElementById("message");
        if(message.value!=='')
        {
            insert_msg(index,receiver,message.value);
            message.value=""
            return;
        }
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
                addDoc(collection(db,'messages'),{
                    from: from,
                    to: to,
                    text: msg,
                    seen:from===to?true:false,
                    createdAt: serverTimestamp()
                })
            })
    }
    useEffect(() => {
        let connect_buttons=document.getElementsByClassName("connect_buttons");
        for(let i=0;i<connect_buttons.length;i++)
        {
            connect_buttons[i].addEventListener('click',()=>{

                if(window.innerWidth<=1100){document.getElementsByClassName('home13')[0].style.flex=0;document.getElementsByClassName('home12')[0].style.flex=1}
                else{document.getElementsByClassName('home13')[0].style.flex=0.5;document.getElementsByClassName('home12')[0].style.flex=1}
                
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
                set_seen(connect_buttons[i].getAttribute('data-indexid'));
            });
        }
    }, [info]);
    return(
        <div className='home' style={{display:`${loaded==true? 'flex':'none'}`}}>
            <div className='top'>
                <label><i class='fas fa-phone'></i>Whatsupp</label>
                <label><i class='fas fa-user'></i>{localStorage.getItem('profile')}</label>
            </div>
            <div className='home1' style={{backgroundColor:bgr}} >
                <div className='home11'>
                    <label><i class='fas fa-comment-dots'></i>Chats</label>
                    <label><i class='fas fa-user'></i>Profile</label>
                    <label><i class='fas fa-cog'></i>Settings</label>
                    <label onClick=
                    {()=>{localStorage.setItem('root',true);nav2('/');}} 
                    ><i class='fas fa-user-plus'></i>Add Account</label>

                </div>
                <div className='home12'>

                    <div className='part1' style={{display:disp}} >
                        <label  id="profile_name" >
                            <i className='fas fa-user'></i> {info[indices.indexOf(receiver)*2]} {status[indices.indexOf(receiver)]}
                        </label>
                        {messages.map((value,index)=>
                        {
                            if(receiver==messages[index][0])
                            {
                                return(
                                    <div key={index} className='chat_detail' style={{display:'flex',flexDirection:'column'}} >
                                        {value[1].map((text,ind)=>
                                        (
                                            text.startsWith('✔✔')?
                                            (<span style={{display:'flex',flexDirection:'column', overflowWrap:'break-word',marginTop:'10px', alignSelf:'flex-end',backgroundColor:'darkgreen',color:'white',borderRadius:'10px',maxWidth:'370px',padding:'5px',fontSize:'20px'}}>
                                            <span style={{maxWidth:'270px',overflowWrap:'break-word',wordBreak:'break-all',wordWrap:'break-word'}}><span style={{color:`${text.startsWith('✔✔✔✔')?'skyblue':'white'}`}}>✔✔</span>{text.startsWith('✔✔✔✔')?text.slice(0,text.lastIndexOf(' ')).replace('✔✔✔✔',''):text.slice(0,text.lastIndexOf(' ')).replace('✔✔','')}</span>
                                            <span style={{fontSize:'10px',marginLeft:'auto',marginTop:'auto'}}>{text.slice(text.lastIndexOf(' ')+1,text.length).replace(text.slice(text.lastIndexOf(' ')+1,text.length)
                                            ,new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleDateString()
                                            .slice(new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleDateString().indexOf('/')+1,
                                            new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleDateString().lastIndexOf('/')).includes(new Date().getDate())?
                                            new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleTimeString():new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleString())}</span></span>):
                                            
                                            
                                            (<span style={{display:'flex',flexDirection:'column', overflowWrap:'break-word',marginTop:'10px', alignSelf:'flex-start',backgroundColor:'black',color:'white',borderRadius:'10px',maxWidth:'370px',padding:'5px',fontSize:'20px'}}>
                                            <span style={{maxWidth:'270px',overflowWrap:'break-word',wordBreak:'break-all',wordWrap:'break-word'}}>{text.slice(0,text.lastIndexOf(' '))}</span>
                                            <span style={{fontSize:'10px',marginLeft:'auto',marginTop:'auto'}}>{text.slice(text.lastIndexOf(' ')+1,text.length).replace(text.slice(text.lastIndexOf(' ')+1,text.length)
                                            ,new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleDateString()
                                            .slice(new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleDateString().indexOf('/')+1,
                                            new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleDateString().lastIndexOf('/')).includes(new Date().getDate())?
                                            new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleTimeString():new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleString())}</span></span>) 
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
                                    <div onClick={()=>{set_seen();set_disp_chat('none');setdisp('flex');update_receiver(value[0]);console.log(receiver);}} className='chat_bar' key={index} style={{display:'flex',flexDirection:'column'}} >
                                        <div style={{height:'35px',fontWeight:'bold'}}>
                                            <span ><i className='fas fa-user'></i> {info[indices.indexOf(value[0])*2]}</span>
                                            <span style={{fontSize:'12px',marginLeft:'auto',overflow:'visible',whiteSpace:'nowrap'}}>
                                                {new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleDateString().slice
                                                (new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleDateString().indexOf('/')+1,
                                                new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleDateString().lastIndexOf('/')).includes( new Date().getDate())?
                                                new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleTimeString():
                                                new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleString()}
                                                </span>
                                        </div>
                                        <div style={{height:'35px'}}>
                                            <span style={{fontWeight:'normal'}}><span style={{color:`${value[1][value[1].length-1].startsWith('✔✔✔✔')?'skyblue':'lightgreen'}`}}>{value[1][value[1].length-1].startsWith('✔✔')?'✔✔':''}</span>{value[1][value[1].length-1].slice(value[1][value[1].length-1].indexOf(' '),value[1][value[1].length-1].lastIndexOf(' '))}</span>
                                            <span style={{marginLeft:'auto',overflow:'visible',whiteSpace:'nowrap',fontWeight:'bold'}}>{value[2]==0?"":value[2]}</span>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                    
                    <div className='part2' style={{display:part2}} >
                        <i style={{alignSelf:'center',paddingTop:'30px'}} class='fas fa-user'></i>
                        <label>Username</label>
                        <input onChange={(e)=>setup_user(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} value={up_user} style={{alignSelf:'end'}}></input>
                        <label>Name</label>
                        <input onChange={(e)=>setup_name(e.target.value.replace(/[^a-zA-Z0-9_ ]/g, ''))} value={up_name} style={{alignSelf:'end'}}></input>
                        <label>About</label>
                        <input onChange={(e)=>setup_bio(e.target.value)} value={up_bio} style={{alignSelf:'end'}}></input>
                        <button onClick={()=>
                            {
                                if(up_user.length>0 && up_user.length<13 && up_name.length>0 && up_name.length<13 && up_bio.length>0 && up_bio.length<21)
                                    {update_info(up_user,up_name,up_bio)}
                                else{alert("Username,Profile Name Range:1-12 and About Range:1-20")
                                }
                            }} id="save">Save</button>
                    </div>
                    
                    <div className='part3' style={{display:part3}} >
                        <i style={{alignSelf:'center',paddingTop:'30px'}} class='fas fa-user'></i>
                        <label>Change Password</label>
                        <input onChange={(e)=>setpass(e.target.value.replace(' ',''))} value={pass} style={{alignSelf:'end'}}></input>
                        <label>Background Theme</label>
                        <select value={bgr} style={{ alignSelf:'end'}} onChange={(e)=>setbg(e.target.value)} >
                            <option style={{color:"white"}} value="white">White</option>
                            <option style={{color:"gold"}} value="gold">Gold</option>
                            <option style={{color:"lime"}} value="lime">Lime</option>
                            <option style={{color:"orange"}} value="orange">Orange</option>
                            <option style={{color:"pink"}} value="pink">Pink</option>
                        </select>
                        <button onClick={()=>
                            {
                                if(pass.length>0 && pass<13){update_settings(pass,bgr)}
                                else{alert("Password Range:1-12")}
                            }} id="save">Save</button>
                    </div>
                </div>
                
                

                <div className='home13' >
                    <span id="youmayknow" style={{fontWeight:'bold', display:'flex', justifySelf:'center', alignSelf:'center',color:'darkgreen'}}><i id="refresh_people" class="fas fa-sync"></i>People you may know!</span>
                    {info.map((a, index) => {
                        if (index < info.length / 2) {
                            w = w + 1; // Increment w before returning
                            return (
                                <div className='userinfo' key={index} > 
                                    <div style={{display:'flex',flexDirection:'column',justifySelf:'center',alignSelf:'center',alignItems:'center',justifyContent:'center',width:'260px',height:'160px',backgroundColor:'darkgreen',borderRadius:'20px',padding:'5px'}}>
                                    <i className='fas fa-user'>{info[index + w ]=== up_name ? ` You ${status[index]=='(Online)'?'(Online)':''}`: `${status[index]=='(Online)'?'(Online)':''}`}</i>                                    
                                    <span className='connect_people' >{info[index + w ]}</span> 
                                    <span style={{fontWeight:'normal'}}>{info[index + w + 1]}</span>
                                    <button onClick={()=>
                                        {
                                            update_receiver(indices[index])
                                                console.log(receiver)
                                        }
                                    } className='connect_buttons' data-indexid={indices[index]}><i className='fas fa-envelope'></i>Message</button>
                                    </div>
                                </div>
                            );
                        }
                        return null; 
                    })}
                </div>

            </div>
            
            <div className='msg_div' style={{display:disp}}>
                <textarea id="message" style={{resize:"none", border:"black solid 1px",borderRadius:"5px"}} placeholder='Type...'
                onChange={()=>typing_status()}></textarea>
                <button id="Send_Button" onClick={()=>Send()} style={{borderRadius:"5px",color:"white",backgroundColor:"green",border:"darkgreen solid 1px",cursor:"pointer"}} >Send</button>
            </div>

            <div className='home11_pro' style={{display:'none'}}>
                <label ><i class='fas fa-comment-dots'></i>Chats</label>
                <label ><i class='fas fa-user'></i>Profile</label>
                <label ><i class='fas fa-cog'></i>Settings</label>
                <label onClick={()=>{localStorage.setItem('root',true);nav2('/')}} ><i class='fas fa-user-plus'></i>Add Account</label>
                <label  id="people"><i class='fas fa-users'></i>People</label>
            </div>
        </div>
    );
}
export default Home;
