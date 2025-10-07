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
    serverTimestamp,
    where,
    getDocs,
    getDoc,
    or,
    updateDoc,
    doc} from "firebase/firestore";
import{
    onDisconnect,set,ref,onValue,
    update,serverTimestamp as rtdb_time
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
    const [profile_section,setprofile_section]=useState('none');
    const [settings_section,setsettings_section]=useState('none');
    const [pass,setpass]=useState('')
    const [bgr,setbg]=useState('white')
    const [disp,setdisp]=useState("none")
    const [receiver,update_receiver]=useState('-');
    const [messages,setmessages]=useState([]);
    const [disp_chat,set_disp_chat]=useState("flex");
    const [indices,set_indices]=useState([]);
    const [innerwidth,set_innerwidth]=useState(window.innerWidth);
    const [status,set_status]=useState([]);
    const current_timeout=useRef(null)
    const [refreshed,set_refresh]=useState(false);
    const [loaded,set_loaded]=useState(false)
    const [time_stamp,set_time_stamp]=useState('');
    const [flag1,set_flag1]=useState(false);
    const [unread,set_unread]=useState(0);
    const [edit_icon,set_edit]=useState('none')
    const [selectval,set_selectval]=useState('Select')
    const [msg_before_edit,set_msg_value]=useState('')
    const [seen_at,set_seen_at]=useState([])
    const [reply_icon,set_reply]=useState('none')
    const [reply_to,set_reply_to]=useState('')
    const [replies,set_replies]=useState([])
    const [msg_transfer,set_msg_transfer]=useState(0)
    const [is_edited,set_is_edited]=useState([])
    const [search_value,set_search_value]=useState('')
    const [search_filter,set_search_filter]=useState([])
    const [no_match_msg,set_no_match_msg]=useState('none')
    const [innerheight,set_innerheight]=useState(window.innerHeight)
    const execute=useRef(0)
    const something_sent=useRef(false)
    const something_edited=useRef(false)

    let w=-1;

    async function set_seen()
    {
        let entries=query(collection(db,'messages'),where("to","==",index),where("from","==",receiver),where("seen","==",false));
        const snapshot=await getDocs(entries);
        snapshot.forEach(async (doc)=>
        {
            await updateDoc(doc.ref,{seen:true,seenAt:serverTimestamp()})
        })
    } 
    async function delete_msg(user,message)
    {
        if(message.startsWith('✔✔'))
        {
            let deleted_msgs=query(collection(db,'messages'),where("from","==",index),where("to","==",user),where("text","==",message.slice(message.indexOf(' ')+1,message.lastIndexOf(' ')-4)));
            let deleted=await getDocs(deleted_msgs)
            deleted=deleted.docs.filter(x=>!x.data().delete)
            if(deleted.length>0){const doc=deleted[0]
            await updateDoc(doc.ref,{delete:message.slice(message.lastIndexOf(' ')+1,message.length)})}

            let deleted_replied_msgs=query(collection(db,'messages'),where("from","==",index),where("to","==",user),where("replied_to",'==',message.replace(message.slice(0,message.indexOf(' ')),'✔')));
            let deleted_replied=await getDocs(deleted_replied_msgs)
            if(deleted_replied.docs.length>0)
            {
                for(let i=0;i<deleted_replied.docs.length;i++)
                {
                    await updateDoc(deleted_replied.docs[i].ref,{replied_to:'deleted'+deleted_replied.docs[i].data().replied_to})
                }
            }
            fetch('/delete_msg',
                {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({from:index,to:user,message:message})
            })
            .then(responce=>responce.json())
        }

    }

    function reply_msg(user,message)
    {
        if(message.startsWith('✔✔') || message.startsWith(' '))
        {
            set_reply('flex');
            set_reply_to(message)
        }
   
    }
    function edit_msg(user,message)
    {
        if(message.startsWith('✔✔'))
        {
            set_edit('flex');
            document.getElementById('message').value=message.slice(message.indexOf(' ')+1,message.lastIndexOf(' ')-4)
            set_msg_value(message)
        }
       
    }
    
    async function write_edit(message)
    {
        something_edited.current=true
        set_edit('none')
        let edit_this_msg=query(collection(db,'messages'),where("from","==",index),where("to","==",receiver),where("text","==",msg_before_edit.slice(msg_before_edit.indexOf(' ')+1,msg_before_edit.lastIndexOf(' ')-4)));
        let edited_msgs=await getDocs(edit_this_msg)
        if(edited_msgs.docs.length>0){const edit_doc=edited_msgs.docs[0]
        await updateDoc(edit_doc.ref,{edit:true,text:message})}

        let edit_replied=query(collection(db,'messages'),where("from","==",index),where("to","==",receiver),where("replied_to","==",msg_before_edit.replace(msg_before_edit.slice(0,msg_before_edit.indexOf(' ')),'✔')));
        let edited_replied_msgs=await getDocs(edit_replied)
        if(edited_replied_msgs.docs.length>0)
        {
            for(let i=0;i<edited_replied_msgs.docs.length;i++)
            {
                await updateDoc(edited_replied_msgs.docs[i].ref,{replied_to:edited_replied_msgs.docs[i].data().replied_to.replace(edited_replied_msgs.docs[i].data().replied_to.slice(edited_replied_msgs.docs[i].data().replied_to.indexOf(' ')+1,edited_replied_msgs.docs[i].data().replied_to.lastIndexOf(' ')-4),message)})
            }
        }
        

        fetch('/edit_message',
            {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({from:index,to:receiver,text:message,original_msg:msg_before_edit})
            }
        )

        set_msg_value('')
        
    }


    function update_data()
    {
        let ind=[]
        let accounts=[]
        fetch('/accounts')
        .then(responce=>responce.json())
        .then(data=>
        {
            for(let i=data.length-1;i>=0;i--)
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
                        let dates=[]
                        let months=['January','February','March','April','May','June','July','August','September','October','November','December']
                        for(let i=0;i<frontend_messages.length;i++)
                        {
                            for(let j=0;j<frontend_messages[i][1].length;j++)
                            {
                                let present_date=new Date(frontend_messages[i][1][j].slice(frontend_messages[i][1][j].lastIndexOf(' ')+1,frontend_messages[i][1][j].length)).toLocaleDateString()
                                if(present_date.slice(present_date.indexOf('/')+1,present_date.lastIndexOf('/'))!==String(new Date().getDate()))
                                {present_date=present_date.replace(present_date.slice(0,present_date.indexOf('/')),months[Number(present_date.slice(0,present_date.indexOf('/')))-1])
                                present_date=present_date.replace(present_date[present_date.indexOf('/')],' ')
                                present_date=present_date.replace(present_date[present_date.lastIndexOf('/')],',')}
                                else{present_date='Today'}
                                if(dates.includes(present_date)===false)
                                {
                                    dates.push(present_date)
                                    frontend_messages[i][1].splice(j,0,present_date)
                                }
                            }
                            dates=[]
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
        if(!index || indices.includes(index)===false || !refreshed){return;}
        let first_snapshot=true
        let q=query(collection(db,'messages'),or(where('from','==',index),where('to','==',index)));
        let action=onSnapshot(q,(snapshot)=>
        {
            if(first_snapshot){first_snapshot=false;return;}
            let msgs=snapshot.docChanges().filter(change=>change.type==='added').map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })
            let edited=snapshot.docChanges().filter(change=>change.type==='modified' && change.doc.data().edit).map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })
            console.log(msgs)
            if(edited.length>0)
            {
                let do_break=false
                setmessages(prev=>
                {
                    let previous=[...prev]
                    for(let i=0;i<previous.length;i++)
                    {
                        if(previous[i][0]===edited[0].to || previous[i][0]===edited[0].from)
                        {
                            for(let j=0;j<previous[i][1].length;j++)
                            {
                                if(previous[i][1][j].endsWith(edited[0].createdAt.toDate().toISOString()))
                                {
                                    previous[i][1][j]=previous[i][1][j].replace(previous[i][1][j].slice(previous[i][1][j].indexOf(' ')+1,previous[i][1][j].lastIndexOf(' ')-4),edited[0].text)
                                    do_break=true
                                    break
                                    
                                }
                            }
                        }
                        if(do_break){break}
                    }
                    return previous
                }
                )
            }
            
                if(msgs.length>0 && (msgs[msgs.length-1].from==index || msgs[msgs.length-1].to==index))
                {
                    let to=msgs[msgs.length-1].to;
                    let from=msgs[msgs.length-1].from;
                    let message_text=msgs[msgs.length-1].text;
                    let time=msgs[msgs.length-1].createdAt===null?new Date().toISOString():msgs[msgs.length-1].createdAt.toDate().toISOString();                    
                    
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
                                    previous[i][1].push(`✔ ${message_text}     ${time}`);
                                    let inter=previous[i]
                                    previous.splice(i,1)
                                    previous.unshift(inter);
                                    set_msg_transfer(prev=>prev+1)
                                    if(msgs[0].reply===true)
                                    {
                                        set_replies(pre=>
                                        {
                                            let original=[...pre]
                                            original[0][previous[0][1].indexOf(`✔ ${message_text}     ${time}`)]=['flex','You',msgs[0].replied_to.slice(msgs[0].replied_to.indexOf(' ')+1,msgs[0].replied_to.lastIndexOf(' ')-4)]
                                            return original
                                        }
                                        )
                                    }
                                    return previous;
                                }
                            }
                            else{
                                if(from==index && previous[i][0]==to)
                                {
                                    found=1
                                    previous[i][1].push(`✔ ${message_text}     ${time}`)
                                    let inter=previous[i]
                                    previous.splice(i,1)
                                    previous.unshift(inter);
                                    if(msgs[0].reply===true)
                                    {
                                        set_replies(pre=>
                                        {
                                            let original=[...pre]
                                            original[0][previous[0][1].indexOf(`✔ ${message_text}     ${time}`)]=['flex',msgs[0].replied_to.startsWith('✔')?'You': info[indices.indexOf(msgs[0].to)*2],msgs[0].replied_to.slice(msgs[0].replied_to.indexOf(' ')+1,msgs[0].replied_to.lastIndexOf(' ')-4)]
                                            return original
                                        }
                                        )
                                    }
                                    set_msg_transfer(prev=>prev+1)
                                    return previous;
                                }
                                else if(to==index && previous[i][0]==from){
                                    found=1
                                    previous[i][1].push(` ${message_text}     ${time}`)
                                    let inter=previous[i]
                                    previous.splice(i,1)
                                    previous.unshift(inter);
                                    set_msg_transfer(prev=>prev+1)
                                    return previous;
                                }
                                
                                
                            }
                            
                        }
                        if(found==0)
                        {
                            if(to==from){previous.unshift([from,[`✔ ${message_text}     ${time}`]]);}
                            else if(from==index){previous.unshift([to,[`✔ ${message_text}     ${time}`]]);}
                            else if(to==index){
                                update_data()
                                previous.unshift([from,[` ${message_text}     ${time}`]]);
                            }
                            set_msg_transfer(prev=>prev+1)
                            return previous;
                        }
                    }
                    );
                        
                }
                            
        })
        return()=>
        {
            action();
        }
    },[index,indices,refreshed])


    useEffect(()=>
    {
        if(!index || indices.includes(index)===false){return;}
        let online_status=ref(real_time_db,`online_status/${index}`);
        let disconnect=onDisconnect(online_status)
        set(online_status,{
            online:true,
            lastseen:rtdb_time()
        })
        onDisconnect(online_status).update(
        {
            online:false,
            lastseen:rtdb_time()
        }
        )
        
        
        let online_users=ref(real_time_db,'/online_status')
        let current_status=onValue(online_users,(snapshot)=>
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
                        statuses.push('('+(new Date(active_users[indices[i]].lastseen).toLocaleDateString()
                        ===new Date().toLocaleDateString()?new Date(active_users[indices[i]].lastseen).toLocaleTimeString():
                        new Date(active_users[indices[i]].lastseen).toLocaleDateString())+')')
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
                lastseen:rtdb_time()
            })
            current_status()
        }
    },[indices,index])

    
    
    useEffect(()=>
    {

        if( !index || indices.includes(index)===false || !refreshed ){return;}
       
        let unseen_messages=query(collection(db,'messages'),where("to","==",index),where("seen","==",false))
        let seen=onSnapshot(unseen_messages,(snapshot)=>
        {
            let msgs=snapshot.docs.map(function(doc)
            {
                return {id:doc.id,...doc.data()}
            })
            console.log(msgs)
            setmessages(prev=>
                {
                    let previous=[...prev]
                    let unread_chats=0
                    for(let i=0;i<previous.length;i++)
                    {
                        let count=0
                        for(let j=0;j<msgs.length;j++)
                        {
                            if(previous[i][0]===msgs[j].from && previous[i][0]!==index)
                            {
                                if(msgs[j].seen===false && !msgs[j].delete)
                                {
                                    for(let k=0;k<previous[i][1].length;k++)
                                    {
                                        if(previous[i][1][k].slice(previous[i][1][k].indexOf(' ')+1,previous[i][1][k].lastIndexOf(' ')-4)===msgs[j].text && msgs[j].createdAt.toDate().toISOString()===previous[i][1][k].slice(previous[i][1][k].lastIndexOf(' ')+1,previous[i][1][k].length))
                                        {
                                            if(receiver!==msgs[j].from)
                                            {count+=1}
                                            else{
                                                let msgref=doc(db,'messages',msgs[j].id)
                                                updateDoc(msgref,{seen:true,seenAt:serverTimestamp()})
                                            }
                                        }
                                    }
                                    
                                }
                            } 
                        }
                        previous[i][2]=count
                        if(count>0){unread_chats+=1}
                    }
                    set_unread(unread_chats)

                    return previous
                })
        })

        let tick_messages=query(collection(db,'messages'),where("from","==",index),where("seen","==",true))
        let ticked=onSnapshot(tick_messages,(snapshot)=>
        {
            let msgs=snapshot.docChanges().map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })

            setmessages(prev=>
                {
                    let previous=[...prev]

                    for(let i=0;i<previous.length;i++)
                    {
                        for(let j=0;j<msgs.length;j++)
                        {
                            if(msgs[j].seen===true && previous[i][0]=== msgs[j].to && msgs[j].createdAt!==null)
                            {
                                for(let k=0;k<previous[i][1].length;k++)
                                {
                                    if(previous[i][1][k].startsWith('✔✔✔✔')===false)
                                    {
                                        if(previous[i][1][k].slice(previous[i][1][k].indexOf(' ')+1,previous[i][1][k].lastIndexOf(" ")-4)===msgs[j].text && msgs[j].createdAt.toDate().toISOString()===previous[i][1][k].slice(previous[i][1][k].lastIndexOf(" ")+1,previous[i][1][k].length))
                                        {
                                            if(!msgs[j].delete)
                                            {
                                                previous[i][1][k]=`✔✔${previous[i][1][k]}`
                                                set_seen_at(pre=>
                                                {
                                                    let original=[...pre]
                                                    original[i][k]=new Date(msgs[j].seenAt.toDate().toISOString()).getDate()===new Date().getDate()?"👁️"+' '+'>'+' '+new Date(msgs[j].seenAt.toDate().toISOString()).toLocaleTimeString():"👁️"+' '+'>'+' '+new Date(msgs[j].seenAt.toDate().toISOString()).toLocaleDateString()
                                                    return original
                                                }
                                                )
                                            }
                                        }
                                    }
                                } 
                            }   
                        }
                    }
                    

                    return previous
                })
        })

            let from_replied_msgs=query(collection(db,'messages'),where("reply","==",true),where("from","==",index))
            let to_replied_msgs=query(collection(db,'messages'),where("reply","==",true),where("to","==",index))
            let replied_docs1=onSnapshot(from_replied_msgs,(snapshot)=>
            {
                let msgs=snapshot.docChanges().map(function(change)
                {
                    return {id:change.doc.id,...change.doc.data()}
                })
                setmessages(prev=>
                {
                    let previous=[...prev]

                    for(let i=0;i<msgs.length;i++)
                    {
                        let stop=false
                        for(let j=0;j<previous.length;j++)
                        {
                            if(previous[j][0]===msgs[i].to && !msgs[i].delete && msgs[i].replied_to.startsWith('d')===false)
                            {
                                for(let k=0;k<previous[j][1].length;k++)
                                {
                                    if(previous[j][1][k].slice(previous[j][1][k].indexOf(' ')+1,previous[j][1][k].lastIndexOf(' ')-4)===msgs[i].text && msgs[i].createdAt!==null  && msgs[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                    {
                                        if(previous[j][1][k].startsWith('✔'))
                                        {
                                            set_replies(pre=>
                                            {
                                                let reply_info=[...pre]
                                                reply_info[j][k]=['flex',msgs[i].replied_to.startsWith('✔')?'You':info[indices.indexOf(msgs[i].to)*2],msgs[i].replied_to.slice(msgs[i].replied_to.indexOf(' ')+1,msgs[i].replied_to.lastIndexOf(' ')-4)]
                                                return reply_info
                                            })
                                        }
                                        else if(previous[j][1][k].startsWith(' '))
                                        {
                                            set_replies(pre=>
                                            {
                                                let reply_info=[...pre]
                                                reply_info[j][k]=['flex',msgs[i].replied_to.startsWith('✔')?'You':info[indices.indexOf(msgs[i].to)*2],msgs[i].replied_to.slice(msgs[i].replied_to.indexOf(' ')+1,msgs[i].replied_to.lastIndexOf(' ')-4)]
    
                                                return reply_info
                                            })
                                        }
                                        stop=true
                                        break
                                    }
                                }
                            }
                            else if(msgs[i].replied_to.startsWith('d'))
                                {
                                    for(let k=0;k<previous[j][1].length;k++)
                                        {
                                            if(previous[j][1][k].slice(previous[j][1][k].indexOf(' ')+1,previous[j][1][k].lastIndexOf(' ')-4)===msgs[i].text && msgs[i].createdAt!==null  && msgs[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                            {
                                                
                                                    set_replies(pre=>
                                                    {
                                                        let reply_info=[...pre]
                                                        reply_info[j][k]=['none','','']
                                                        return reply_info
                                                    })
                                                
                                                stop=true
                                                break
                                            }
                                        }
                                    
    
                                    
                                    
                                }
                            if(stop){break}
                        }
    
                    }
                    

                    return previous
                })
    
            })
            let replied_docs2=onSnapshot(to_replied_msgs,(snapshot)=>
            {
                let msgs=snapshot.docChanges().map(function(change)
                {
                    return {id:change.doc.id,...change.doc.data()}
                })
    
                setmessages(prev=>
                    {
                        let previous=[...prev]

                        for(let i=0;i<msgs.length;i++)
                        {
                            let stop=false
                            for(let j=0;j<previous.length;j++)
                            {
                                if(previous[j][0]===msgs[i].from && !msgs[i].delete && msgs[i].from!==msgs[i].to && msgs[i].replied_to.startsWith('d')===false)
                                {
                                    for(let k=0;k<previous[j][1].length;k++)
                                    {
    
                                        if(previous[j][1][k].slice(previous[j][1][k].indexOf(' ')+1,previous[j][1][k].lastIndexOf(' ')-4)===msgs[i].text && msgs[i].createdAt!==null  && msgs[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                            {
                                            
                                            if(previous[j][1][k].startsWith('✔'))
                                            {
                                            set_replies(pre=>
                                                {
                                                    let reply_info=[...pre]
                                                    reply_info[j][k]=['flex',msgs[i].replied_to.startsWith('✔')?'You':info[indices.indexOf(msgs[i].to)*2],msgs[i].replied_to.slice(msgs[i].replied_to.indexOf(' ')+1,msgs[i].replied_to.lastIndexOf(' ')-4)]
    
                                                    return reply_info
                                                })                                        
                                            }
                                            else if(previous[j][1][k].startsWith(' '))
                                            {
                                                set_replies(pre=>
                                                {
                                                    let reply_info=[...pre]
                                                    reply_info[j][k]=['flex',msgs[i].replied_to.startsWith('✔')?info[indices.indexOf(msgs[i].from)*2]:'You',msgs[i].replied_to.slice(msgs[i].replied_to.indexOf(' ')+1,msgs[i].replied_to.lastIndexOf(' ')-4)]
                                                    return reply_info
                                                })                                        
                                            }
                                            stop=true
                                            break
                                        }
                                    }
                                }
                                else if(msgs[i].replied_to.startsWith('d') && msgs[i].from!==msgs[i].to)
                                    {
                                        for(let k=0;k<previous[j][1].length;k++)
                                            {
                                                if(previous[j][1][k].slice(previous[j][1][k].indexOf(' ')+1,previous[j][1][k].lastIndexOf(' ')-4)===msgs[i].text && msgs[i].createdAt!==null  && msgs[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                                {
                                                    
                                                        set_replies(pre=>
                                                        {
                                                            let reply_info=[...pre]
                                                            reply_info[j][k]=['none','','']
                                                            return reply_info
                                                        })
                                                    
                                                    stop=true
                                                    break
                                                }
                                            }
                                    }
                                if(stop){break}
                                
                            }
        
                        }
                        

                        return previous
                    })
    
            })

        let from_edited=query(collection(db,'messages'),where("edit","==",true),where("from","==",index))
        let to_edited=query(collection(db,'messages'),where("edit","==",true),where("to","==",index))
        let edit_from=onSnapshot(from_edited,(snapshot)=>
        {
            let msgs=snapshot.docChanges().map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })
            setmessages(prev=>
                {
                    let previous=[...prev]
                    for(let i=0;i<msgs.length;i++)
                    {
                        let stop=false
                        for(let j=0;j<previous.length;j++)
                        {
                            if(previous[j][0]===msgs[i].to && !msgs[i].delete && msgs[i].from!==msgs[i].to )
                            {
                                for(let k=0;k<previous[j][1].length;k++)
                                {
                                    if(previous[j][1][k].slice(previous[j][1][k].indexOf(' ')+1,previous[j][1][k].lastIndexOf(' ')-4)===msgs[i].text && msgs[i].createdAt!==null  && msgs[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                    {
                                        set_is_edited(pre=>
                                        {
                                            let original=[...pre]
                                            original[j][k]='Edited'
                                            return original

                                        }
                                        )
                                        stop=true
                                        break
                                    }
                                }
                            }
                            if(stop){break}
                        }
                    }
                    

                    return previous
                })
        }) 

        let edit_to=onSnapshot(to_edited,(snapshot)=>
        {
            let msgs=snapshot.docChanges().map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })
            setmessages(prev=>
                {
                    let previous=[...prev]
                    for(let i=0;i<msgs.length;i++)
                    {
                        let stop=false
                        for(let j=0;j<previous.length;j++)
                        {
                            if(previous[j][0]===msgs[i].from && !msgs[i].delete)
                            {
                                for(let k=0;k<previous[j][1].length;k++)
                                {
                                    if(previous[j][1][k].slice(previous[j][1][k].indexOf(' ')+1,previous[j][1][k].lastIndexOf(' ')-4)===msgs[i].text && msgs[i].createdAt!==null  && msgs[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                    {
                                        set_is_edited(pre=>
                                        {
                                            let original=[...pre]
                                            original[j][k]='Edited'
                                            return original
                                        }
                                        )
                                        stop=true
                                        break
                                    }
                                }
                            }
                            if(stop){break}
                        }
                    }
                    

                    return previous
                })
        })

        
            let already_deleted=query(collection(db,'messages'),or(where("from",'==',index),where('to','==',index)))
        
            let deleted_docs=onSnapshot(already_deleted,(snapshot)=>
            {
                let msgs=snapshot.docChanges().filter(x=>x.doc.data().delete).map(function(change)
                {
                    return {id:change.doc.id,...change.doc.data()}
                })
                setmessages(prev=>
                {
                    let previous=[...prev]
                    for(let i=0;i<msgs.length;i++)
                    {
                        let stop=false
                        for(let j=0;j<previous.length;j++)
                        {
                            if(previous[j][0]===msgs[i].from || previous[j][0]===msgs[i].to)
                            {
                                for(let k=0;k<previous[j][1].length;k++)
                                {
                                    if(previous[j][1][k].slice(previous[j][1][k].indexOf(' ')+1,previous[j][1][k].lastIndexOf(' ')-4)===msgs[i].text && msgs[i].createdAt!==null  && msgs[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                    {
                                        previous[j][1].splice(k,1)
                                        if(previous[j][1][k-1]!==undefined){if(!previous[j][1][k-1].startsWith('✔') && !previous[j][1][k-1].startsWith(' ') ){previous[j][1].splice(k-1,1)}}
                                        if(previous[j][1].length===0){previous.splice(j,1)}
                                        if(msgs[i].edit)
                                        {
                                            set_is_edited(pre=>
                                            {
                                                let original=[...pre]
                                                original[j].splice(k,1)
                                                return original
                                            }
                                            )
                                        }
                                        if(msgs[i].reply)
                                        {
                                            set_replies(pre=>
                                            {
                                                let original=[...pre]
                                                original[j].splice(k,1)
                                                return original
                                            }
                                            )
                                        }
                                        if(msgs[i].seen===true)
                                        {
                                            set_seen_at(pre=>
                                            {
                                                let original=[...pre]
                                                original[j].splice(k,1)
                                                return original
                                            }
                                            )
                                        }
                                        stop=true
                                        break
                                    }
                                }
                            }
                            if(stop){break}
                        }
                    }
                    previous.sort((a,b)=>
                    {
                        return new Date(b[1][b[1].length-1].slice(b[1][b[1].length-1].lastIndexOf(' ')+1,b[1][b[1].length-1].length))-
                        new Date(a[1][a[1].length-1].slice(a[1][a[1].length-1].lastIndexOf(' ')+1,a[1][a[1].length-1].length))
    
                    })
                    
                    
                    return previous

                }
                )
                if(flag1===true){set_loaded(true);}

            })

        return()=>
        {
            seen()
            ticked()
            replied_docs1()
            replied_docs2()
            edit_from();
            edit_to();
            deleted_docs()
        }
    },[indices,index,refreshed,receiver])

    useEffect(() => {
        
        if(window.innerWidth<=1100){
            let people=document.getElementById('people');
            if(window.getComputedStyle(people).color=='rgb(255, 255, 255)')
            {document.getElementsByClassName('people_section')[0].style.flex=0;}
            else
            {document.getElementsByClassName('people_section')[0].style.flex=1;document.getElementsByClassName('main_body_section')[0].style.flex=0;}    
        }
        else{
            document.getElementsByClassName('people_section')[0].style.display='flex';
            document.getElementsByClassName('people_section')[0].style.flex=0.5;
            document.getElementsByClassName('main_body_section')[0].style.flex=1;
            document.getElementsByClassName('main_body_section')[0].style.display='flex';
        }
    
    },[innerwidth])
        
    useEffect(()=>
    {

        let body_section=document.querySelector('.body_section')
        let main_body_section=document.querySelector('.main_body_section')
        let people_section=document.querySelector('.people_section')

        if(innerwidth<=1100 && innerwidth>500){body_section.style.height=(window.innerHeight-30)+'px';main_body_section.style.height=(window.innerHeight-30)+'px';people_section.style.height=(window.innerHeight-30)+'px'}
        else if(innerwidth<=500){body_section.style.height=(window.innerHeight-40)+'px';main_body_section.style.height=(window.innerHeight-40)+'px';people_section.style.height=(window.innerHeight-40)+'px'}
        else if(innerwidth>1100){body_section.style.height=(window.innerHeight)+'px';main_body_section.style.height=(window.innerHeight)+'px';people_section.style.height=(window.innerHeight)+'px'}
    },[innerheight,innerwidth])
    useEffect(() => {
        let container=document.getElementsByClassName('chat_detail_section');
        if(container.length>0){container[0].scrollTop = container[0].scrollHeight;}
        document.getElementById('message').value=''
        set_edit('none')
    },[receiver])

    useEffect(()=>
    {
        if(messages.length!==replies.length)
        {
            set_replies(prev=>
            {
                let previous=[...prev]
                for(let i=0;i<messages.length;i++)
                {
                    previous[i]=previous[i]||[]
                }
                return previous
            })
        }
        if(messages.length!==seen_at.length)
        {
            set_seen_at(prev=>
            {
                let previous=[...prev]
                for(let i=0;i<messages.length;i++)
                {
                    previous[i]=previous[i]||[]
                }
                return previous
            })
        }
        if(messages.length!==is_edited.length)
        {
            set_is_edited(prev=>
            {
                let previous=[...prev]
                for(let i=0;i<messages.length;i++)
                {
                    previous[i]=previous[i]||[]
                }
                return previous
            })
        }
    },[messages])

    useEffect(()=>
    {
        if(!msg_transfer || !refreshed){return}
        setmessages(prev=>
        {
            let previous=[...prev]
            let months=['January','February','March','April','May','June','July','August','September','October','November','December']
            for(let i=0;i<previous.length;i++)
            {
                for(let j=0;j<previous[i][1].length;j++)
                {
                    if(previous[i][1][j].startsWith(' ') || previous[i][1][j].startsWith('✔'))
                    {
                        let present_date=new Date(previous[i][1][j].slice(previous[i][1][j].lastIndexOf(' ')+1,previous[i][1][j].length)).toLocaleDateString()
                        if(present_date!==String(new Date().toLocaleDateString()))
                        {present_date=present_date.replace(present_date.slice(0,present_date.indexOf('/')),months[Number(present_date.slice(0,present_date.indexOf('/')))-1])
                        present_date=present_date.replace(present_date[present_date.indexOf('/')],' ')
                        present_date=present_date.replace(present_date[present_date.lastIndexOf('/')],',')}
                        else{present_date='Today'}
                        if(previous[i][1].includes(present_date)===false)
                        {
                            previous[i][1].splice(j,0,present_date)
                        }
                    }
                }
                
            }
            return previous
        })
        
    },[msg_transfer,refreshed])

    useEffect(()=>
    {
        let container=document.getElementsByClassName('chat_detail_section');
        if(container.length>0){container[0].scrollTop = container[0].scrollHeight;}
    },[msg_transfer])

    useEffect(() => {
        window.addEventListener('resize',()=>
        {
            set_innerwidth(window.innerWidth);
            set_innerheight(window.innerHeight);
        })

        fetch("/accounts")
        .then(response => response.json())
        .then(data => 
            {
                let flag=[false,null]
                let accounts=[] 
                for(let i=0;i<data.length;i++)
                {
                    if(data[i].email===username)
                    {
                        localStorage.setItem('profile',data[i].name)
                        localStorage.setItem('index',data[i].index)
                        change_profile(localStorage.getItem('profile'))
                        change_index(localStorage.getItem('index'))
                        retrieve_messages(data[i].index)
                        flag=[true,data[i].name===null?localStorage.getItem('profile'):data[i].name]
                        set_flag1(true)
                        setup_user(data[i].email);
                        setup_name(data[i].name);
                        setup_bio(data[i].bio);
                        setpass(data[i].password);
                        if(data[i].bg===null){data[i].bg='white'}
                        setbg(data[i].bg);
                    }
                }
                if(flag[0]===false){set_flag1(false);set_loaded(false);alert(`No account exists with '${username}'`);localStorage.setItem('root',true);nav2('/');}
                else if(flag[1]===null){set_flag1(false);set_loaded(false);alert(`Please submit profile details!`);nav2('/profile')}
                let ind=[]
                for(let i=data.length-1;i>=0;i--)
                {
                    accounts.push(data[i].name);
                    accounts.push(data[i].bio);
                    ind.push(data[i].index)
                }
                set_indices(ind);
                setinfo(accounts);
            }
        );
        let icons=document.querySelectorAll(".desktop_icons label");
        icons[0].style.backgroundColor='darkgreen'
        icons[0].style.color='white'
        let refresh_people=document.getElementById("refresh_people");
        refresh_people.addEventListener("click",function()
        {
            fetch("/accounts")
            .then(response => response.json())
            .then(data => 
            {
                let accounts=[]
                let ind=[]
                for(let i=data.length-1;i>=0;i--)
                {
                    accounts.push(data[i].name);
                    accounts.push(data[i].bio);
                    ind.push(data[i].index)
                }
                set_indices(ind);
                setinfo(accounts);
            })
        })
        let phone_icons=document.querySelectorAll(".phone_icons label");
        phone_icons[0].style.color='lime'
        for(let i=0;i<phone_icons.length;i++)
        {
            phone_icons[i].addEventListener('click',()=>{
            update_receiver('-')
            for(let j=0;j<phone_icons.length;j++)
            {   
                phone_icons[j].style.color='white';
                if(j<3)
                {
                    icons[j].style.backgroundColor='lightgreen'
                    icons[j].style.color='darkgreen'
                }
            }   
            phone_icons[i].style.color='lime';
            phone_icons[i].style.borderRadius='6px';
            if(i<3)
            {
                icons[i].style.backgroundColor='darkgreen'
                icons[i].style.color='white'
            }
            if(i==0){setprofile_section('none');setsettings_section('none');setdisp('none');set_disp_chat('flex');document.getElementsByClassName('people_section')[0].style.display='none';document.getElementsByClassName('people_section')[0].style.flex=0;document.getElementsByClassName('main_body_section')[0].style.flex=1}
            if(i==1){setprofile_section('flex');setsettings_section('none');setdisp('none');set_disp_chat('none');document.getElementsByClassName('people_section')[0].style.display='none';document.getElementsByClassName('people_section')[0].style.flex=0;document.getElementsByClassName('main_body_section')[0].style.flex=1}
            if(i==2){setprofile_section('none');setsettings_section('flex');setdisp('none');set_disp_chat('none');document.getElementsByClassName('people_section')[0].style.display='none';document.getElementsByClassName('people_section')[0].style.flex=0;document.getElementsByClassName('main_body_section')[0].style.flex=1}
            if(i==4){setprofile_section('none');setsettings_section('none');setdisp('none');set_disp_chat('none');document.getElementsByClassName('people_section')[0].style.display='flex';document.getElementsByClassName('people_section')[0].style.flex=1;document.getElementsByClassName('main_body_section')[0].style.flex=0}
            });
        }

        for(let i=0;i<icons.length;i++)
        {
            icons[i].addEventListener('click',()=>{
                update_receiver('-')
                for(let j=0;j<icons.length;j++)
                {
                    icons[j].style.backgroundColor='lightgreen';
                    icons[j].style.color='darkgreen';
                }   
                for(let k=0;k<phone_icons.length;k++)
                {
                    phone_icons[k].style.color='white';
                }
                icons[i].style.backgroundColor='darkgreen';
                icons[i].style.color='white';
                phone_icons[i].style.color='lime'
                if(i==0){setprofile_section('none');setsettings_section('none');setdisp('none');set_disp_chat('flex')}
                if(i==1){setprofile_section('flex');setsettings_section('none');setdisp('none');set_disp_chat('none')}
                if(i==2){setprofile_section('none');setsettings_section('flex');setdisp('none');set_disp_chat('none')}
            });
        }
        
    }, []);
    
    async function Send(message)
    {
        something_sent.current=true
        let ids=[]
        let msg_being_replied=""
        if(reply_icon==='flex')
        {
            set_reply('none')
            msg_being_replied=reply_to
            set_reply_to('')
        }
        let inserted_msg=await addDoc(collection(db,'messages'),{
            from: index,
            to: receiver,
            text: message,
            seen:index===receiver?true:false,
            createdAt: serverTimestamp(),
            seenAt:index===receiver?serverTimestamp():null,
            replied_to:msg_being_replied.startsWith('✔')? msg_being_replied.replace(msg_being_replied.slice(0,msg_being_replied.indexOf(' ')),'✔'):msg_being_replied.startsWith(' ')?msg_being_replied:'',
            reply: msg_being_replied===''?false:true,
        });

        onSnapshot(inserted_msg,(document)=>
        {
            let data=document.data()
            if(data!==undefined)
            {
                if(!data.createdAt){return}
                else
                {
                    if(ids.includes(document.id)===false)
                    {
                    ids.push(document.id)
                    set_time_stamp(data.createdAt.toDate().toISOString())

                    setmessages(prev=>
                        {
                            let previous=[...prev]
                            previous[0][1][previous[0][1].length-1]='✔'+previous[0][1][previous[0][1].length-1].replace(`${previous[0][1][previous[0][1].length-1].slice(previous[0][1][previous[0][1].length-1].lastIndexOf(' ')+1,previous[0][1][previous[0][1].length-1].length)}`,data.createdAt.toDate().toISOString())
                            return previous
                        })
                        
                    insert_msg(index,receiver,message,data.createdAt.toDate().toISOString());
                    return;
                    }
                }
            }
        })    
    }
    
    
    function insert_msg(from,to,msg,time)
    {
        fetch('/save_msg',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from: from, to: to, message: msg,time:time }),
        })
        .then(response => response.json())
        .then(data=>
        {   

        })
    }
    useEffect(() => {
        let connect_buttons=document.getElementsByClassName("connect_buttons");
        for(let i=0;i<connect_buttons.length;i++)
        {
            connect_buttons[i].addEventListener('click',()=>{

                if(window.innerWidth<=1100){document.getElementsByClassName('people_section')[0].style.flex=0;document.getElementsByClassName('main_body_section')[0].style.flex=1}
                else{document.getElementsByClassName('people_section')[0].style.flex=0.5;document.getElementsByClassName('main_body_section')[0].style.flex=1}
                
                setdisp("flex");
                setprofile_section('none');
                setsettings_section('none');
                set_disp_chat('none');

                let phone_icons=document.querySelectorAll(".phone_icons label");
                for(let j=0;j<phone_icons.length;j++)
                {
                    phone_icons[j].style.color='white';
                } 
                phone_icons[0].style.color='lime'
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

    useEffect(()=>
    {
        let values=[]
        if(search_value!=='')
        {
            for(let i=0;i<info.length;i+=2)
            {
                if(info[i].toLowerCase().startsWith(search_value.toLowerCase()))
                {
                    values[i/2]='flex'
                }
                else{values[i/2]='none'}
            }
            let found_result=false
            values.forEach(x=>
            {
                if(x==='flex'){found_result=true;return}
            })
            if(found_result){set_no_match_msg('none')}
            else{set_no_match_msg('flex')}

        }
        else if(search_value==='')
        {
            for(let i=0;i<info.length;i+=2)
            {
                    values[i/2]='flex'
            }
            set_no_match_msg('none')
        }
        set_search_filter(values)
    },[search_value,info])
    return(
        <>
        <div style={{display:`${loaded==true? 'none':'flex'}`,height:'100dvh',justifyContent:'center',alignItems:'center',width:'auto'}}>
            <div><label style={{fontSize:'40px',fontWeight:'bold', color:'darkgreen'}}><i class="fas fa-mobile-alt"></i> Whatsupp</label></div>
        </div>
        <div className='home' style={{display:`${loaded==true? 'flex':'none'}`}}>
            <div className='top'>
                <label><i class='fas fa-mobile-alt'></i>Whatsupp</label>
                <label><i class='fas fa-user'></i>{profile}</label>
            </div>
            <div className='body_section' style={{backgroundColor:bgr}} >
                <div className='desktop_icons'>
                    <label><i class='fas fa-comment-dots'></i>Chats<sup>{unread===0?'':unread}</sup></label>
                    <label><i class='fas fa-user'></i>Profile</label>
                    <label><i class='fas fa-cog'></i>Settings</label>
                    <label onClick=
                    {()=>{localStorage.setItem('root',true);nav2('/');}} 
                    ><i class='fas fa-user-plus'></i>Add Account</label>

                </div>
                <div className='main_body_section'>

                    <div className='chat_detail_section' style={{display:disp}} >
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
                                            text.startsWith('✔')?
                                            (<span style={{marginRight:'10px',display:'flex',flexDirection:'column', overflowWrap:'break-word',marginTop:'10px', alignSelf:'flex-end',backgroundColor:'darkgreen',color:'white',borderRadius:'10px',maxWidth:'270px',padding:'5px',fontSize:'20px'}}>
                                            <select id='options1' value={selectval} onChange={(e)=>
                                                { 
                                                if(e.target.value==='Delete'){set_edit('none'); set_msg_value('');set_reply('none');set_reply_to('');delete_msg(receiver,text);}
                                                else if(e.target.value==='Edit'){set_reply('none');set_reply_to('');edit_msg(receiver,text);}
                                                else if(e.target.value==="Reply"){set_edit('none');set_msg_value('');reply_msg(receiver,text);}
                                                else{set_edit('none');set_msg_value('');set_reply('none');set_reply_to('');}
                                                set_selectval('Select')}}
                                                    style={{marginBottom:'auto',marginLeft:'auto',width:'20px',height:'10px'}}>
                                                <option value='Select'>🧾 Select</option>
                                                <option value='Edit'>✏️ Edit</option>
                                                <option value='Delete'>🗑️ Delete</option>
                                                <option value='Reply'>💬 Reply</option>
                                                <option value='seen'>{seen_at[index]?.[ind]===undefined?'👁️ > ❌':seen_at[index]?.[ind]}</option>
                                            </select>

                                            <span style={{display:replies[index]?.[ind]?.[0]===undefined?'none':replies[index][ind][0],width:'260px',flexDirection:'column',padding:'5px',borderRadius:'5px',backgroundColor:'lightslategray'}}>
                                                <span style={{fontWeight:'bold'}}>{replies[index]?.[ind]?.[1]===undefined?'':replies[index][ind][1]}</span>
                                                <span style={{textOverflow:'ellipsis',overflowX:'hidden',whiteSpace:'nowrap'}}>{replies[index]?.[ind]?.[2]===undefined?'':replies[index][ind][2]}</span>
                                            </span>

                                            <span style={{minWidth:'100px',maxWidth:'270px',overflowWrap:'break-word',wordBreak:'break-all',wordWrap:'break-word'}}><span style={{color:`${text.startsWith('✔✔✔✔')?'deepskyblue':'darksalmon'}`}}>{text.startsWith('✔✔')?'✔✔':'✔'}</span>{text.slice(0,text.lastIndexOf(' ')).replace(text.slice(0,text.indexOf(' ')),'')}</span>
                                            <span style={{fontSize:'10px',marginLeft:'auto',marginTop:'auto'}}>{is_edited[index]?.[ind]===undefined?'':is_edited[index]?.[ind]} {new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleTimeString()}</span>
                                            </span>):
                                            
                                            text.startsWith(' ')?
                                            (<span style={{marginLeft:'10px',display:'flex',flexDirection:'column', overflowWrap:'break-word',marginTop:'10px', alignSelf:'flex-start',backgroundColor:bgr==='#221130'?'lightslategray':'#221130',color:'white',borderRadius:'10px',maxWidth:'370px',padding:'5px',fontSize:'20px'}}>
                                            <select id='options2' value={selectval} onChange={(e)=>
                                                { 
                                                if(e.target.value==="Reply"){reply_msg(receiver,text);}
                                                else{set_reply('none');set_reply_to('')}
                                                set_selectval('Select')}}
                                                    style={{marginBottom:'auto',marginLeft:'auto',width:'20px',height:'10px'}}>
                                                <option value='Select'>🧾 Select</option>
                                                <option value='Reply'>💬 Reply</option>
                                            </select>

                                            <span style={{display:replies[index]?.[ind]?.[0]===undefined?'none':replies[index][ind][0],width:'260px',flexDirection:'column',padding:'5px',borderRadius:'5px',backgroundColor:bgr==='#221130'?'#221130':'lightslategray'}}>
                                                <span style={{fontWeight:'bold'}}>{replies[index]?.[ind]?.[1]===undefined?'':replies[index][ind][1]}</span>
                                                <span style={{textOverflow:'ellipsis',overflowX:'hidden',whiteSpace:'nowrap'}}>{replies[index]?.[ind]?.[2]===undefined?'':replies[index][ind][2]}</span>
                                            </span>
                                            
                                            <span style={{minWidth:'100px', maxWidth:'270px',overflowWrap:'break-word',wordBreak:'break-all',wordWrap:'break-word'}}>{text.slice(0,text.lastIndexOf(' '))}</span>
                                            <span style={{fontSize:'10px',marginLeft:'auto',marginTop:'auto'}}>{is_edited[index]?.[ind]===undefined?'':is_edited[index]?.[ind]} {new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleTimeString()}</span></span>):

                                            (<span style={{alignSelf:'center', marginTop:'10px',backgroundColor:'lightslategray',color:'white',borderRadius:'10px',padding:'5px'}}>{text}</span>) 
                                        )
                                        )}
                                    </div>
                                )
                            }
                        })}
                    </div>
                    <div className='chats' style={{display:disp_chat}}>
                        <label id="connect_msg" style={{border:bgr==='#221130'?'solid white':'solid darkgreen',color:bgr==='#221130'?'white':'darkgreen', display:'flex',justifyContent:'center',alignItems:'center'}}><i class="fas fa-users"></i> Start connecting with people.</label>

                        {messages.map((value,index)=>
                            {
                                return(
                                    <div onClick={()=>{set_seen();set_disp_chat('none');setdisp('flex');update_receiver(value[0]);}} className='chat_bar' key={index} style={{display:'flex',flexDirection:'column',border:bgr==='#221130'?'solid white ':'solid darkgreen'}} >
                                        <div style={{height:'35px',fontWeight:'bold'}}>
                                            <span style={{paddingLeft:'5px',paddingTop:'5px',color:bgr==='#221130'?'lime':'darkgreen'}}><i className='fas fa-user'></i> {info[indices.indexOf(value[0])*2]}</span>
                                            <span style={{color:bgr==='#221130'?'white':'darkgreen',paddingRight:'5px',fontSize:'12px',paddingTop:'5px',marginLeft:'auto',overflow:'visible',whiteSpace:'nowrap'}}>
                                                {new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleDateString()=== new Date().toLocaleDateString()?
                                                new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleTimeString():
                                                new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleDateString()}
                                                </span>
                                        </div>
                                        <div style={{height:'35px'}}>
                                            <span style={{fontWeight:'normal',paddingLeft:'5px',color:bgr==='#221130'?'white':'darkgreen'}}><span style={{color:`${value[1][value[1].length-1].startsWith('✔✔✔✔')?'deepskyblue':'darksalmon'}`}}>{status[indices.indexOf(value[0])]==="(Typing...)"?"":value[1][value[1].length-1].startsWith('✔✔')?'✔✔':value[1][value[1].length-1].startsWith('✔')?"✔":''}</span>{status[indices.indexOf(value[0])]==="(Typing...)"?"Typing...": value[1][value[1].length-1].slice(value[1][value[1].length-1].indexOf(' '),value[1][value[1].length-1].lastIndexOf(' '))}</span>
                                            <span style={{color:bgr==='#221130'?'lime':'darkgreen',paddingRight:'5px',marginLeft:'auto',overflow:'visible',whiteSpace:'nowrap',fontWeight:'bold'}}>{value[2]==0?"":value[2]}</span>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                    
                    <div className='profile_section' style={{display:profile_section}} >
                        <i style={{alignSelf:'center',paddingTop:'30px',color:bgr==='#221130'?'lime':'darkgreen'}} class='fas fa-user'></i>
                        <label style={{color:bgr==='#221130'?'lime':'darkgreen'}}>Username 🔑</label>
                        <input onChange={(e)=>setup_user(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} value={up_user} style={{alignSelf:'end'}}></input>
                        <label style={{color:bgr==='#221130'?'lime':'darkgreen'}}>Name 🏷️</label>
                        <input onChange={(e)=>
                            {
                            if(e.target.value[0]===' '){e.target.value=e.target.value.substring(1)}
                            setup_name(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                            }} value={up_name} style={{alignSelf:'end'}}></input>
                        <label style={{color:bgr==='#221130'?'lime':'darkgreen'}}>About 📝</label>
                        <input onChange={(e)=>
                            {
                            if(e.target.value[0]===' '){e.target.value=e.target.value.substring(1)}
                            setup_bio(e.target.value)
                            }} value={up_bio} style={{alignSelf:'end'}}></input>
                        <button onClick={()=>
                            {
                                if(up_user.length>0 && up_user.length<13 && up_name.length>0 && up_name.length<13 && up_bio.length>0 && up_bio.length<21)
                                    {update_info(up_user,up_name,up_bio)}
                                else{alert("Username,Profile Name Range:1-12 and About Range:1-20")
                                }
                            }} id="save">Save</button>
                    </div>
                    
                    <div className='settings_section' style={{display:settings_section}} >
                        <i style={{alignSelf:'center',paddingTop:'30px',color:bgr==='#221130'?'lime':'darkgreen'}} class='fas fa-user'></i>
                        <label style={{color:bgr==='#221130'?'lime':'darkgreen'}}>Change Password 🔒</label>
                        <input onChange={(e)=>setpass(e.target.value.replace(' ',''))} value={pass} style={{alignSelf:'end'}}></input>
                        <label style={{color:bgr==='#221130'?'lime':'darkgreen'}}>Background Theme 🎨</label>
                        <select value={bgr} style={{ alignSelf:'end',color:'#221130'}} onChange={(e)=>setbg(e.target.value)} >
                            <option  value="white">Light</option>
                            <option  value="yellow">Yellow</option>
                            <option  value="#221130">Dark</option>
                        </select>
                        <label style={{color:bgr==='#221130'?'lime':'darkgreen'}}>Read More 👉</label>
                        <a href='https://github.com/learner763/Whatsupp/#readme' style={{color:bgr==='#221130'?'white':'darkgreen'}}>Documentation</a>
                        <button onClick={()=>
                            {
                                if(pass.length>0 && pass.length<13){update_settings(pass,bgr)}
                                else{alert("Password Range:1-12")}
                            }} id="save">Save</button>
                    </div>
                </div>
                
                

                <div className='people_section' >
                    <span id="youmayknow" style={{fontWeight:'bold', display:'flex', justifySelf:'center', alignSelf:'center',color:bgr==='#221130'?'white':'darkgreen'}}><i style={{marginTop:'2.5px'}} id="refresh_people" class="fas fa-sync"></i>People you may know!</span>
                    <aa style={{display:'flex',justifyContent:'center',width:'100%'}}>
                        <input placeholder='Search ...' value={search_value} 
                        onChange={(e)=>
                            {
                                if(e.target.value[0]===' '){e.target.value=e.target.value.substring(1)}
                                if(e.target.value.length>12){e.target.value=e.target.value.slice(0,12)}
                                set_search_value(e.target.value.replace(/[^a-zA-Z0-9_ ]/g, ''))
                            }}
                        style={{ display:'flex',width:'200px',justifySelf:'center',alignSelf:'center',borderRadius:'5px',border:'1px solid darkgreen',fontSize:'20px'}}></input>
                        <button onClick={()=>set_search_value('')} style={{cursor:'pointer', fontSize:'20px',borderRadius:'5px',border:'1px solid darkgreen',backgroundColor:'darkgreen',color:'white'}}>Clear</button>
                    </aa>
                    <span style={{display:no_match_msg, color:bgr==='#221130'?'white':'darkgreen',justifyContent:'center',alignItems:'center',fontWeight:'bold'}}>No match for '{search_value}'</span>
                    {info.map((a, index) => {
                        if (index < info.length / 2) {
                            w = w + 1; // Increment w before returning
                            return (
                                <div className='userinfo' key={index} style={{display:search_filter[index]}}> 
                                    <div style={{display:search_filter[index],flexDirection:'column',justifySelf:'center',alignSelf:'center',alignItems:'center',justifyContent:'center',width:'260px',height:'160px',backgroundColor:'darkgreen',borderRadius:'20px',padding:'5px'}}>
                                    <i className='fas fa-user'>{info[index + w ]=== profile ? ` You ${status[index]==='(Online)' || status[index]==='(Typing...)'?'(Online)':''}`: `${status[index]==='(Online)' || status[index]==='(Typing...)'?'(Online)':''}`}</i>                                    
                                    <span className='connect_people' >{info[index + w ]}</span> 
                                    <span style={{fontWeight:'normal'}}>{info[index + w + 1]}</span>
                                    <button onClick={()=>
                                        {
                                            update_receiver(indices[index])
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
                <button  style={{display:edit_icon,fontSize:'20px',borderRadius:'30px',cursor:'pointer'}} onClick={()=>{set_edit('none');document.getElementById('message').value='';set_msg_value('')}}>✏️❌</button>
                <button  style={{display:reply_icon,fontSize:'20px',borderRadius:'30px',cursor:'pointer'}} onClick={()=>{set_reply('none');set_reply_to('')}}>🔁❌</button>

                <textarea id="message" style={{ resize:"none",borderRadius:"30px",paddingLeft:'12px'}} placeholder='Type...'
                onChange={()=>
                {
                    if(document.getElementById('message').value.startsWith(' ')){document.getElementById('message').value=document.getElementById('message').value.substring(1)}
                    typing_status()
                }
                }></textarea>
                <button id="Send_Button" onClick={()=>{
                    if(document.getElementById('message').value!='')
                    {
                    if(edit_icon==='none'){Send(document.getElementById('message').value)};
                    if(edit_icon==='flex'){write_edit(document.getElementById('message').value)}
                    document.getElementById('message').value=''}}} style={{borderRadius:"30px",fontSize:'20px',color:"white",cursor:"pointer"}} >⏩⏩</button>
            </div>

            <div className='phone_icons' style={{display:'none'}}>
                <label ><i class='fas fa-comment-dots'></i>Chats<sup>{unread===0?'':unread}</sup></label>
                <label ><i class='fas fa-user'></i>Profile</label>
                <label ><i class='fas fa-cog'></i>Settings</label>
                <label onClick={()=>{localStorage.setItem('root',true);nav2('/')}} ><i class='fas fa-user-plus'></i>Add Account</label>
                <label  id="people"><i class='fas fa-users'></i>People</label>
            </div>
        </div>
        </>
    );
}
export default Home;
