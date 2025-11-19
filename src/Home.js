import React, {  useEffect, useRef, useState } from 'react';
import './Home.css';
import { BrowserRouter ,  useNavigate } from 'react-router-dom';
import {db,real_time_db,auth_app} from './firebase';
import { signInAnonymously } from 'firebase/auth';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    serverTimestamp,
    where,
    getDocs,
    or,
    updateDoc,
    doc} from "firebase/firestore";
import{
    onDisconnect,set,ref,onValue,
    update,serverTimestamp as rtdb_time} from "firebase/database";
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
    const [profile_section,set_profile_section]=useState('none');
    const [settings_section,set_settings_section]=useState('none');
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
    const [flag1,set_flag1]=useState(false);
    const [unread,set_unread]=useState(0);
    const [edit_icon,set_edit]=useState('none')
    const [selectval,set_selectval]=useState('Select')
    const [msg_before_edit,set_msg_value]=useState('')
    const [reply_icon,set_reply]=useState('none')
    const [reply_to,set_reply_to]=useState('')
    const [msg_transfer,set_msg_transfer]=useState(0)
    const [search_value,set_search_value]=useState('')
    const [search_filter,set_search_filter]=useState([])
    const [no_match_msg,set_no_match_msg]=useState('none')
    const [innerheight,set_innerheight]=useState(window.innerHeight)
    const [verified,set_verified]=useState(false)
    const on_reload=useRef(false)
    const receiver_again=useRef('-');
    const [msg_attributes,set_msg_attributes]=useState([])
    let w=-1;

    async function set_seen(user)
    {
        let entries=query(collection(db,'messages'),where("to","==",index),where("from","==",user),where("seen","==",false));
        let unseen=await getDocs(entries);
        for(let i=0;i<unseen.docs.length;i++)
        {
            await updateDoc(unseen.docs[i].ref,{seen:true,seenAt:serverTimestamp()})
        }
        setmessages(prev=>
        {
            let previous=[...prev]
            if(previous.findIndex(x=>x[0]===user)===-1){return previous;}
            previous[previous.findIndex(x=>x[0]===user)][2]=0
            set_unread(pre_unread=>
            {
                if(pre_unread!==0){return pre_unread-1}
                else{return 0}
            })
            return previous
        })
        
    } 

    async function delete_msg(user,message)
    {
        if(message.startsWith('✔✔'))
        {
            let deleted_msgs=query(collection(db,'messages'),where("from","==",index),where("to","==",user),where("text","==",message.slice(message.indexOf(' ')+1,message.lastIndexOf(' ')-4)));
            let deleted=await getDocs(deleted_msgs)
            for(let i=0;i<deleted.docs.length;i++)
            {
                if(deleted.docs[i].data().createdAt.toDate().toISOString()===message.slice(message.lastIndexOf(' ')+1,message.length))
                {
                    await updateDoc(deleted.docs[i].ref,{delete:true})
                }
            }
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
            document.getElementById('Send_Button').style.backgroundColor='lime'
        }
    }
    
    async function write_edit(message)
    {
        set_edit('none')
        let intermediate=msg_before_edit
        set_msg_value('')
        let edit_this_msg=query(collection(db,'messages'),where("from","==",index),where("to","==",receiver),where("text","==",intermediate.slice(intermediate.indexOf(' ')+1,intermediate.lastIndexOf(' ')-4)));
        let edited_msgs=await getDocs(edit_this_msg)
        for(let i=0;i<edited_msgs.docs.length;i++)
        {
            if(edited_msgs.docs[i].data().createdAt.toDate().toISOString()===intermediate.slice(intermediate.lastIndexOf(' ')+1,intermediate.length))
            {
                await updateDoc(edited_msgs.docs[i].ref,{edit:true,text:message})
            }
        }
        let edit_replied=query(collection(db,'messages'),where("from","==",index),where("to","==",receiver),where("replied_to","==",intermediate.replace(intermediate.slice(0,intermediate.indexOf(' ')),'✔')));
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
            body:JSON.stringify({from:index,to:receiver,text:message,original_msg:intermediate})
        })
    }

    async function find_qouted_msg(message)
    {
        let qouted_msg=query(collection(db,'messages'),where("text","==",message.slice(message.indexOf(' ')+1,message.lastIndexOf(' ')-4)))
        let qouted_doc=await getDocs(qouted_msg)
        setmessages(prev=>
        {
            let previous=[...prev]
            let stop=false
            for(let i=0;i<qouted_doc.docs.length;i++)
            {    
                if(qouted_doc.docs[i].data().createdAt.toDate().toISOString()!==message.slice(message.lastIndexOf(' ')+1,message.length)){continue}
                for(let j=0;j<previous.length;j++)
                {
                    if(previous[j][0]===qouted_doc.docs[i].data().to || previous[j][0]===qouted_doc.docs[i].data().from)
                    {
                        for(let k=0;k<previous[j][1].length;k++)
                        {
                            if(previous[j][1][k].endsWith(qouted_doc.docs[i].data().replied_to.slice(qouted_doc.docs[i].data().replied_to.indexOf(' ')+1,qouted_doc.docs[i].data().replied_to.length)))
                            {
                                document.getElementsByClassName('chat_detail')[0].children[k].scrollIntoView({behavior:'smooth',block:'center'});
                                document.getElementsByClassName('chat_detail')[0].children[k].style.animation='none';
                                void document.getElementsByClassName('chat_detail')[0].children[k].offsetHeight;
                                document.getElementsByClassName('chat_detail')[0].children[k].style.animation='highlight 3s ease';
                                stop=true
                                break
                            }
                        }
                    }
                    if(stop){break}
                }
                if(stop){break}
            }
            return previous
        })
    }

    function update_data()
    {
        let ind=[]
        let accounts=[]
        fetch("/accounts",
        {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({test:'test'})
        })
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
        })
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
            if(data.error){alert(data.error);nav2('/',{state:{er:true}})}
            else{
                signInAnonymously(auth_app)
                .then(res=>set_verified(true))
                let frontend_messages=[]
                let feature_array=[]
                for(let i=0;i<data.length;i+=2)
                {
                    frontend_messages.push([data[i],data[i+1],0])
                }
                for(let i=0;i<frontend_messages.length;i++)
                {
                    feature_array[i]=[]
                }
                set_msg_attributes(feature_array.map(arr=>[...arr]))
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
        if(!index || indices.includes(index)===false || !verified){return;}
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
    },[indices,index,verified])

    useEffect(()=>
    {
        if( !index || indices.includes(index)===false || !refreshed || !verified ){return;}
        let action_query=query(collection(db,'messages'),or(where('from','==',index),where('to','==',index)));
        let action=onSnapshot(action_query,(snapshot)=>
        {
            let sent_messages=snapshot.docChanges().filter(change=>change.type==='added' && !change.doc.data().delete && on_reload.current).map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })
            let edited_messages=snapshot.docChanges().filter(change=>change.doc.data().edit && !change.doc.data().delete).map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })
            let unseen_messages=snapshot.docChanges().filter(change=>!change.doc.data().seen && change.doc.data().to===index ).map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })
            let read_messages=snapshot.docChanges().filter(change=>change.doc.data().seen && change.doc.data().from===index && !change.doc.data().delete).map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })
            let replied_messages=snapshot.docChanges().filter(change=>change.doc.data().reply && !change.doc.data().delete).map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })
            let deleted_messages=snapshot.docChanges().filter(change=>change.doc.data().delete).map(function(change)
            {
                return {id:change.doc.id,...change.doc.data()}
            })

            if(sent_messages.length>0)
            {
                let to=sent_messages[0].to;
                let from=sent_messages[0].from;
                let message_text=sent_messages[0].text;
                let time=sent_messages[0].createdAt===null?new Date().toISOString():sent_messages[0].createdAt.toDate().toISOString();                    
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
                                set_msg_attributes(pre_attributes=>
                                {
                                    let previous_attributes=[...pre_attributes]
                                    let spliced_element=previous_attributes[i]
                                    previous_attributes.splice(i,1)
                                    previous_attributes.unshift(spliced_element)
                                    return previous_attributes
                                })
                                if(sent_messages[0].reply===true)
                                {
                                    set_msg_attributes(pre_attributes=>
                                    {
                                        let previous_attributes=[...pre_attributes]
                                        if(!previous_attributes[0][previous[0][1].indexOf(`✔ ${message_text}     ${time}`)])
                                        {previous_attributes[0][previous[0][1].indexOf(`✔ ${message_text}     ${time}`)]={}}
                                        previous_attributes[0][previous[0][1].indexOf(`✔ ${message_text}     ${time}`)].reply_info=['flex','You',sent_messages[0].replied_to.slice(sent_messages[0].replied_to.indexOf(' ')+1,sent_messages[0].replied_to.lastIndexOf(' ')-4)]
                                        return previous_attributes
                                    })
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
                                set_msg_attributes(pre_attributes=>
                                {
                                    let previous_attributes=[...pre_attributes]
                                    let spliced_element=previous_attributes[i]
                                    previous_attributes.splice(i,1)
                                    previous_attributes.unshift(spliced_element)
                                    return previous_attributes
                                })
                                if(sent_messages[0].reply===true)
                                {
                                    set_msg_attributes(pre_attributes=>
                                    {
                                        let previous_attributes=[...pre_attributes]
                                        if(!previous_attributes[0][previous[0][1].indexOf(`✔ ${message_text}     ${time}`)])
                                        {previous_attributes[0][previous[0][1].indexOf(`✔ ${message_text}     ${time}`)]={}}
                                        previous_attributes[0][previous[0][1].indexOf(`✔ ${message_text}     ${time}`)].reply_info=['flex','You',sent_messages[0].replied_to.slice(sent_messages[0].replied_to.indexOf(' ')+1,sent_messages[0].replied_to.lastIndexOf(' ')-4)]
                                        return previous_attributes
                                    })
                                }
                                return previous;
                            } 
                            else if(to==index && previous[i][0]==from){
                                found=1
                                previous[i][1].push(` ${message_text}     ${time}`)
                                let inter=previous[i]
                                previous.splice(i,1)
                                previous.unshift(inter);
                                set_msg_attributes(pre_attributes=>
                                {
                                    let previous_attributes=[...pre_attributes]
                                    let spliced_element=previous_attributes[i]
                                    previous_attributes.splice(i,1)
                                    previous_attributes.unshift(spliced_element)
                                    return previous_attributes
                                })
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
                        set_msg_attributes(pre_attributes=>
                        {
                            let previous_attributes=[...pre_attributes]
                            previous_attributes.unshift([])
                            return previous_attributes
                        })
                        return previous;
                    }
                });  
                set_msg_transfer(prev=>prev+1)
            }

            setmessages(prev=>
            {
                let previous=[...prev]
                for(let i=0;i<edited_messages.length;i++)
                {
                    let stop=false
                    for(let j=0;j<previous.length;j++)
                    {
                        if(previous[j][0]===edited_messages[i].to || previous[j][0]===edited_messages[i].from )
                        {
                            for(let k=0;k<previous[j][1].length;k++)
                            {
                                if(edited_messages[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                {
                                    previous[j][1][k]=previous[j][1][k].replace(previous[j][1][k].slice(previous[j][1][k].indexOf(' ')+1,previous[j][1][k].lastIndexOf(' ')-4),edited_messages[i].text)
                                    set_msg_attributes(pre_attributes=>
                                    {
                                        let previous_attributes=[...pre_attributes]
                                        if(!previous_attributes[j][k]){previous_attributes[j][k]={}}
                                        previous_attributes[j][k].edit_info='Edited'
                                        return previous_attributes
                                    })
                                    stop=true
                                    break
                                }
                            }
                        }
                        if(stop){break}
                    }
                }
                for(let i=0;i<unseen_messages.length;i++)
                {
                    let stop=false
                    for(let j=0;j<previous.length;j++)                    
                    {
                        if(previous[j][0]===unseen_messages[i].from)
                        {
                            for(let k=0;k<previous[j][1].length;k++)
                            {
                                if(unseen_messages[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                {
                                    if(receiver_again.current!==unseen_messages[i].from)
                                    {previous[j][2]+=1}
                                    else{
                                        let msgref=doc(db,'messages',unseen_messages[i].id)
                                        updateDoc(msgref,{seen:true,seenAt:serverTimestamp()})
                                    }
                                    stop=true
                                    break
                                }
                            }
                        } 
                        if(stop){break}
                    }
                }
                let unread_chats=0
                for(let i=0;i<previous.length;i++)
                {
                    if(previous[i][2]>0){unread_chats+=1}
                }
                set_unread(unread_chats)
                for(let i=0;i<read_messages.length;i++)
                {
                    let stop=false
                    for(let j=0;j<previous.length;j++)
                    {
                        if(previous[j][0]=== read_messages[i].to && read_messages[i].createdAt!==null)
                        {
                            for(let k=0;k<previous[j][1].length;k++)
                            {
                                if(read_messages[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(" ")+1,previous[j][1][k].length))
                                {
                                    previous[j][1][k]=`✔✔${previous[j][1][k]}`
                                    set_msg_attributes(pre_attributes=>
                                    {
                                        let previous_attributes=[...pre_attributes]
                                        if(!previous_attributes[j][k]){previous_attributes[j][k]={}}
                                        previous_attributes[j][k].seen_info=new Date(read_messages[i].seenAt.toDate().toISOString()).getDate()===new Date().getDate()?"👁️"+' '+'>'+' '+new Date(read_messages[i].seenAt.toDate().toISOString()).toLocaleTimeString():"👁️"+' '+'>'+' '+new Date(read_messages[i].seenAt.toDate().toISOString()).toLocaleDateString()
                                        return previous_attributes
                                    })
                                    stop=true
                                    break
                                }
                            } 
                        }   
                        if(stop){break}
                    }
                }
                for(let i=0;i<replied_messages.length;i++)
                {
                    let stop=false
                    for(let j=0;j<previous.length;j++)
                    {
                        if((previous[j][0]===replied_messages[i].to || previous[j][0]===replied_messages[i].from) &&  replied_messages[i].replied_to.startsWith('d')===false)
                        {
                            for(let k=0;k<previous[j][1].length;k++)
                            {
                                if(replied_messages[i].createdAt!==null  && replied_messages[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                {
                                    if(previous[j][1][k].startsWith('✔'))
                                    {
                                        set_msg_attributes(pre_attributes=>
                                        {
                                            let previous_attributes=[...pre_attributes]
                                            if(!previous_attributes[j][k]){previous_attributes[j][k]={}}
                                            previous_attributes[j][k].reply_info=['flex',replied_messages[i].replied_to.startsWith('✔')?'You':info[indices.indexOf(replied_messages[i].to)*2],replied_messages[i].replied_to.slice(replied_messages[i].replied_to.indexOf(' ')+1,replied_messages[i].replied_to.lastIndexOf(' ')-4)]
                                            return previous_attributes
                                        })
                                    }
                                    else if(previous[j][1][k].startsWith(' '))
                                    {
                                        set_msg_attributes(pre_attributes=>
                                        {
                                            let previous_attributes=[...pre_attributes]
                                            if(!previous_attributes[j][k]){previous_attributes[j][k]={}}
                                            previous_attributes[j][k].reply_info=['flex',replied_messages[i].replied_to.startsWith('✔')?info[indices.indexOf(replied_messages[i].from)*2]:'You',replied_messages[i].replied_to.slice(replied_messages[i].replied_to.indexOf(' ')+1,replied_messages[i].replied_to.lastIndexOf(' ')-4)]
                                            return previous_attributes
                                        })
                                    }
                                    stop=true
                                    break
                                }
                            }
                        }
                        else if(replied_messages[i].replied_to.startsWith('d'))
                        {
                            for(let k=0;k<previous[j][1].length;k++)
                            {
                                if(replied_messages[i].createdAt!==null  && replied_messages[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                {
                                    set_msg_attributes(pre_attributes=>
                                    {
                                        let previous_attributes=[...pre_attributes]
                                        if(!previous_attributes[j][k]){previous_attributes[j][k]={}}
                                        previous_attributes[j][k].reply_info=['none','','']
                                        return previous_attributes
                                    })
                                    stop=true
                                    break
                                }
                            }
                        }
                        if(stop){break}
                    }
                }
                let remove_elements=0
                for(let i=0;i<deleted_messages.length;i++)
                {
                    let stop=false
                    for(let j=0;j<previous.length;j++)
                    {
                        if(previous[j][0]===deleted_messages[i].from || previous[j][0]===deleted_messages[i].to)
                        {
                            for(let k=0;k<previous[j][1].length;k++)
                            {
                                if(deleted_messages[i].createdAt.toDate().toISOString()===previous[j][1][k].slice(previous[j][1][k].lastIndexOf(' ')+1,previous[j][1][k].length))
                                {
                                    if(previous[j][1][k-1]!=undefined)
                                    {
                                        if(!previous[j][1][k-1].startsWith('✔') && !previous[j][1][k-1].startsWith(' '))
                                        {
                                            if(!previous[j][1][k+1] || (!previous[j][1][k+1].startsWith('✔') && !previous[j][1][k+1].startsWith(' ')))
                                            {remove_elements=2
                                            previous[j][1].splice(k-1,2)}
                                            else{remove_elements=1;previous[j][1].splice(k,1)}
                                        }
                                        else{remove_elements=1;previous[j][1].splice(k,1)}
                                    }
                                    
                                    set_msg_attributes(pre_attributes=>
                                    {
                                        let previous_attributes=[...pre_attributes]
                                        if(remove_elements===1){pre_attributes[j].splice(k,1)};if(remove_elements===2){pre_attributes[j].splice(k-1,1)}
                                        return previous_attributes
                                    })
                                    if(previous[j][1].length===0)
                                    {   
                                        console.log(previous)
                                        previous.splice(j,1)
                                        console.log(previous)

                                        set_msg_attributes(pre_attributes=>
                                        {
                                            let previous_attributes=[...pre_attributes]
                                            previous_attributes.splice(j,1)
                                            return previous_attributes
                                        })
                                    }
                                    stop=true
                                    break
                                }
                            }
                        }
                        if(stop){break}
                    }
                }
                if(!on_reload.current || remove_elements>0)
                {
                    let friends=previous.map(x=>x[0])
                    console.log(previous)
                    previous.sort((a,b)=>
                    {
                        return new Date(b[1][b[1].length-1].slice(b[1][b[1].length-1].lastIndexOf(' ')+1,b[1][b[1].length-1].length))-
                        new Date(a[1][a[1].length-1].slice(a[1][a[1].length-1].lastIndexOf(' ')+1,a[1][a[1].length-1].length))
                    })
                    let friends_updated=previous.map(x=>x[0])
                    set_msg_attributes(pre_attributes=>
                    {
                        let previous_attributes=[...pre_attributes]
                        for(let i=0;i<friends.length;i++)
                        {
                            if(friends[i]!==friends_updated[i])
                            {
                                let a=previous_attributes[i]
                                let b=friends.indexOf(friends_updated[i])
                                previous_attributes[i]=previous_attributes[b]
                                previous_attributes[b]=a
                                let temp=friends[i]
                                friends[i]=friends_updated[i]
                                friends[b]=temp
                            }
                        }
                        return previous_attributes
                    })
                }
                return previous
            })
            if(!on_reload.current){set_msg_transfer(pre_value=>pre_value+1);on_reload.current=true}
            if(flag1===true){set_loaded(true);}
        })
        return()=>
        {
            action()
        }
    },[indices,index,refreshed,verified])

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
        console.log(msg_attributes)
    },[msg_attributes])

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
        document.getElementById('message').style.height='51px'
        document.getElementById('Send_Button').style.backgroundColor='#EEEEEE'
        document.getElementsByClassName('chat_detail_section')[0].style.marginBottom='70px'
        set_edit('none')
        set_msg_value('')
        set_reply('none')
        set_reply_to('')
    },[receiver])

    useEffect(()=>
    {
        if(msg_before_edit.length>0 || reply_to.length>0)
        {
            document.getElementsByClassName('chat_detail_section')[0].style.marginBottom=
            parseInt(getComputedStyle(document.getElementsByClassName('chat_detail_section')[0]).marginBottom)+50+'px'
        }
    },[msg_before_edit,reply_to])

    useEffect(()=>
    {
        if(!msg_transfer || !refreshed){return}
        setmessages(prev=>
        {
            let previous=[...prev]
            let days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
            let months=['January','February','March','April','May','June','July','August','September','October','November','December']
            for(let i=0;i<previous.length;i++)
            {
                for(let j=0;j<previous[i][1].length;j++)
                {
                    if(previous[i][1][j].startsWith(' ') || previous[i][1][j].startsWith('✔'))
                    {
                        let present_date=new Date(previous[i][1][j].slice(previous[i][1][j].lastIndexOf(' ')+1,previous[i][1][j].length)).toLocaleDateString()
                        if(present_date!==String(new Date().toLocaleDateString()))
                        {
                            if(present_date.slice(0,present_date.indexOf('/'))===String(new Date().getMonth()+1) && present_date.slice(present_date.lastIndexOf('/')+1,present_date.length)===String(new Date().getFullYear()))
                            {
                                let difference=new Date().getDate()-Number(present_date.slice(present_date.indexOf('/')+1,present_date.lastIndexOf('/')))
                                if(difference===1){present_date='Yesterday'}
                                else if(difference<7)
                                {
                                    present_date=days[new Date(previous[i][1][j].slice(previous[i][1][j].lastIndexOf(' ')+1,previous[i][1][j].length)).getDay()]
                                }
                                else{
                                present_date=present_date.replace(present_date.slice(0,present_date.indexOf('/')),months[Number(present_date.slice(0,present_date.indexOf('/')))-1])
                                present_date=present_date.replace(present_date[present_date.indexOf('/')],' ')
                                present_date=present_date.replace(present_date[present_date.lastIndexOf('/')],',')
                                }
                            }
                            else
                            {
                                present_date=present_date.replace(present_date.slice(0,present_date.indexOf('/')),months[Number(present_date.slice(0,present_date.indexOf('/')))-1])
                                present_date=present_date.replace(present_date[present_date.indexOf('/')],' ')
                                present_date=present_date.replace(present_date[present_date.lastIndexOf('/')],',')
                            }
                        }
                        else{present_date='Today'}
                        if(previous[i][1].includes(present_date)===false)
                        {
                            previous[i][1].splice(j,0,present_date)
                            set_msg_attributes(pre_attributes=>
                            {
                                let previous_attributes=[...pre_attributes]
                                previous_attributes[i].splice(j,0,present_date)
                                return previous_attributes
                            })
                        }
                    }
                }
                if(msg_transfer>1)
                {
                    if(receiver_again.current===previous[0][0])
                    {document.getElementsByClassName('chat_detail')[0].children[document.getElementsByClassName('chat_detail')[0].children.length-1].scrollIntoView({behavior:'smooth'})}
                    break
                }
            }
            return previous
        })
    },[msg_transfer,refreshed])

    useEffect(() => {
        window.addEventListener('resize',()=>
        {
            set_innerwidth(window.innerWidth);
            set_innerheight(window.innerHeight);
        })
        fetch("/accounts",
        {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({test:'test'})
        })
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
            if(flag[0]===false){set_flag1(false);set_loaded(false);alert(`No account exists with ${username}`);localStorage.setItem('root',true);nav2('/');}
            else if(flag[1]==='null'){set_flag1(false);set_loaded(false);alert('Please submit profile details!');nav2('/profile')}
            let ind=[]
            for(let i=data.length-1;i>=0;i--)
            {
                accounts.push(data[i].name);
                accounts.push(data[i].bio);
                ind.push(data[i].index)
            }
            set_indices(ind);
            setinfo(accounts);
        });
        let icons=document.querySelectorAll(".desktop_icons label");
        icons[0].style.backgroundColor='darkgreen'
        icons[0].style.color='white'
        let refresh_people=document.getElementById("refresh_people");
        refresh_people.addEventListener("click",function()
        {
            fetch("/accounts",
            {
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({test:'test'})
            })
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
            receiver_again.current='-'
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
            if(i==0){set_profile_section('none');set_settings_section('none');setdisp('none');set_disp_chat('flex');document.getElementsByClassName('people_section')[0].style.display='none';document.getElementsByClassName('people_section')[0].style.flex=0;document.getElementsByClassName('main_body_section')[0].style.flex=1}
            if(i==1){set_profile_section('flex');set_settings_section('none');setdisp('none');set_disp_chat('none');document.getElementsByClassName('people_section')[0].style.display='none';document.getElementsByClassName('people_section')[0].style.flex=0;document.getElementsByClassName('main_body_section')[0].style.flex=1}
            if(i==2){set_profile_section('none');set_settings_section('flex');setdisp('none');set_disp_chat('none');document.getElementsByClassName('people_section')[0].style.display='none';document.getElementsByClassName('people_section')[0].style.flex=0;document.getElementsByClassName('main_body_section')[0].style.flex=1}
            if(i==4){set_profile_section('none');set_settings_section('none');setdisp('none');set_disp_chat('none');document.getElementsByClassName('people_section')[0].style.display='flex';document.getElementsByClassName('people_section')[0].style.flex=1;document.getElementsByClassName('main_body_section')[0].style.flex=0}
            });
        }
        for(let i=0;i<icons.length;i++)
        {
            icons[i].addEventListener('click',()=>{
                update_receiver('-')
                receiver_again.current='-'
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
                if(i==0){set_profile_section('none');set_settings_section('none');setdisp('none');set_disp_chat('flex')}
                if(i==1){set_profile_section('flex');set_settings_section('none');setdisp('none');set_disp_chat('none')}
                if(i==2){set_profile_section('none');set_settings_section('flex');setdisp('none');set_disp_chat('none')}
            });
        }
    }, []);
    
    async function Send(message)
    {
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
            if(data.success)
            {
                setmessages(prev=>
                {
                    let previous=[...prev]
                    previous[0][1][previous[0][1].length-1]='✔'+previous[0][1][previous[0][1].length-1].replace(`${previous[0][1][previous[0][1].length-1].slice(previous[0][1][previous[0][1].length-1].lastIndexOf(' ')+1,previous[0][1][previous[0][1].length-1].length)}`,time)
                    return previous
                })
            }
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
                set_profile_section('none');
                set_settings_section('none');
                set_disp_chat('none');
                let phone_icons=document.querySelectorAll(".phone_icons label");
                let icons=document.querySelectorAll(".desktop_icons label");
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
        <div style={{display:loaded==true? 'none':'flex',height:'100dvh',justifyContent:'center',alignItems:'center',width:'auto'}}>
            <div><label style={{fontSize:'40px',fontWeight:'bold', color:'darkgreen'}}><i class="fas fa-mobile-alt"></i> WhatsUpp</label></div>
        </div>
        <div className='home' style={{display:loaded==true? 'flex':'none'}}>
            <div className='top'>
                <label><i class='fas fa-mobile-alt'></i>WhatsUpp</label>
                <label><i class='fas fa-user'></i>{profile}</label>
            </div>
            <div className='body_section' style={{backgroundColor:bgr}} >
                <div className='desktop_icons'>
                    <label><i class='fas fa-comment-dots'></i>Read Chats<sup>{unread===0?'':unread}</sup></label>
                    <label><i class='fas fa-user'></i>Update Profile</label>
                    <label><i class='fas fa-cog'></i>Alter Settings</label>
                    <label onClick=
                    {()=>{localStorage.setItem('root',true);nav2('/');}} 
                    ><i class='fas fa-user-plus'></i>Switch Account</label>
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
                                                    <option value='seen'>{!msg_attributes[index]?.[ind]?.seen_info?'👁️ > ❌':msg_attributes[index]?.[ind]?.seen_info}</option>
                                                </select>
                                                <span onClick={()=> find_qouted_msg(text)}
                                                    style={{cursor:'pointer',display:!msg_attributes[index]?.[ind]?.reply_info?.[0]?"none":msg_attributes[index][ind].reply_info[0],width:'260px',flexDirection:'column',padding:'5px',borderRadius:'5px',backgroundColor:'forestgreen',border:'1px white solid'}}>
                                                    <span style={{fontWeight:'bold'}}>{!msg_attributes[index]?.[ind]?.reply_info?.[1]?'':msg_attributes[index][ind].reply_info[1]}</span>
                                                    <span style={{textOverflow:'ellipsis',overflowX:'hidden',whiteSpace:'nowrap'}}>{!msg_attributes[index]?.[ind]?.reply_info?.[2]?'':msg_attributes[index][ind].reply_info[2]}</span>
                                                </span>
                                                <span style={{minWidth:'100px',maxWidth:'270px',overflowWrap:'break-word',wordBreak:'break-all',wordWrap:'break-word'}}><span style={{color:`${text.startsWith('✔✔✔✔')?'deepskyblue':'darksalmon'}`}}>{text.startsWith('✔✔')?'✔✔':'✔'}</span>{text.slice(0,text.lastIndexOf(' ')).replace(text.slice(0,text.indexOf(' ')),'')}</span>
                                                <span style={{fontSize:'10px',marginLeft:'auto',marginTop:'auto'}}>{!msg_attributes[index]?.[ind]?.edit_info?'':msg_attributes[index][ind].edit_info} {new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleTimeString()}</span>
                                            </span>):
                                            text.startsWith(' ')?
                                            (<span style={{marginLeft:'10px',display:'flex',flexDirection:'column', overflowWrap:'break-word',marginTop:'10px', alignSelf:'flex-start',backgroundColor:'rebeccapurple',color:'white',borderRadius:'10px',maxWidth:'370px',padding:'5px',fontSize:'20px'}}>
                                                <select id='options2' value={selectval} onChange={(e)=>
                                                    { 
                                                    if(e.target.value==="Reply"){reply_msg(receiver,text);}
                                                    else{set_reply('none');set_reply_to('')}
                                                    set_selectval('Select')}}
                                                        style={{marginBottom:'auto',marginLeft:'auto',width:'20px',height:'10px'}}>
                                                    <option value='Select'>🧾 Select</option>
                                                    <option value='Reply'>💬 Reply</option>
                                                </select>
                                                <span onClick={()=> find_qouted_msg(text)}
                                                    style={{cursor:'pointer',display:!msg_attributes[index]?.[ind]?.reply_info?.[0]?'none':msg_attributes[index][ind].reply_info[0],width:'260px',flexDirection:'column',padding:'5px',borderRadius:'5px',backgroundColor:'mediumpurple',border:'1px white solid'}}>
                                                    <span style={{fontWeight:'bold'}}>{!msg_attributes[index]?.[ind]?.reply_info?.[1]?'':msg_attributes[index][ind].reply_info[1]}</span>
                                                    <span style={{textOverflow:'ellipsis',overflowX:'hidden',whiteSpace:'nowrap'}}>{!msg_attributes[index]?.[ind]?.reply_info?.[2]?'':msg_attributes[index][ind].reply_info[2]}</span>
                                                </span>
                                                <span style={{minWidth:'100px', maxWidth:'270px',overflowWrap:'break-word',wordBreak:'break-all',wordWrap:'break-word'}}>{text.slice(0,text.lastIndexOf(' '))}</span>
                                                <span style={{fontSize:'10px',marginLeft:'auto',marginTop:'auto'}}>{!msg_attributes[index]?.[ind]?.edit_info?'':msg_attributes[index][ind].edit_info} {new Date(text.slice(text.lastIndexOf(' ')+1,text.length)).toLocaleTimeString()}</span>
                                            </span>):
                                            (<span style={{alignSelf:'center', marginTop:'10px',backgroundColor:'rebeccapurple',color:'white',borderRadius:'10px',padding:'5px'}}>{text}</span>) 
                                        )
                                        )}
                                    </div>
                                )
                            }
                        })}
                    </div>
                    <div className='chats' style={{display:disp_chat}}>
                        <label id="connect_msg" style={{border:bgr==='black'?'solid white':'solid darkgreen',color:bgr==='black'?'white':'darkgreen', display:'flex',justifyContent:'center',alignItems:'center'}}><i class="fas fa-users"></i> Start connecting with people.</label>
                        {messages.map((value,index)=>
                            {
                                return(
                                    <div onClick={()=>{set_seen(value[0]);set_disp_chat('none');setdisp('flex');receiver_again.current=value[0];update_receiver(value[0]);}} className='chat_bar' key={index} style={{display:'flex',flexDirection:'column',border:bgr==='black'?'solid white ':'solid darkgreen'}} >
                                        <div style={{height:'35px',fontWeight:'bold'}}>
                                            <span style={{paddingLeft:'5px',paddingTop:'5px',color:bgr==='black'?'lime':'darkgreen'}}><i className='fas fa-user'></i> {info[indices.indexOf(value[0])*2]}</span>
                                            <span style={{color:bgr==='black'?'white':'darkgreen',paddingRight:'5px',fontSize:'12px',paddingTop:'5px',marginLeft:'auto',overflow:'visible',whiteSpace:'nowrap'}}>
                                                {new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleDateString()=== new Date().toLocaleDateString()?
                                                new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleTimeString():
                                                new Date(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(' ')+1,value[1][value[1].length-1].length)).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div style={{height:'35px'}}>
                                            <span style={{fontWeight:'normal',paddingLeft:'5px',color:bgr==='black'?'white':'darkgreen'}}><span style={{color:`${value[1][value[1].length-1].startsWith('✔✔✔✔')?'deepskyblue':'darksalmon'}`}}>{status[indices.indexOf(value[0])]==="(Typing...)"?"":value[1][value[1].length-1].startsWith('✔✔')?'✔✔':value[1][value[1].length-1].startsWith('✔')?"✔":''}</span>{status[indices.indexOf(value[0])]==="(Typing...)"?"Typing...": value[1][value[1].length-1].slice(value[1][value[1].length-1].indexOf(' '),value[1][value[1].length-1].lastIndexOf(' '))}</span>
                                            <span style={{color:bgr==='black'?'lime':'darkgreen',paddingRight:'5px',marginLeft:'auto',overflow:'visible',whiteSpace:'nowrap',fontWeight:'bold'}}>{value[2]==0?"":value[2]}</span>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                    <div className='profile_section' style={{display:profile_section}} >
                        <i style={{alignSelf:'center',paddingTop:'30px',color:bgr==='black'?'lime':'darkgreen'}} class='fas fa-user'></i>
                        <label style={{color:bgr==='black'?'lime':'darkgreen'}}>Username 🔑</label>
                        <input onChange={(e)=>setup_user(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} value={up_user} style={{alignSelf:'end'}}></input>
                        <label style={{color:bgr==='black'?'lime':'darkgreen'}}>Name 🏷️</label>
                        <input onChange={(e)=>
                            {
                                if(e.target.value[0]===' '){e.target.value=e.target.value.substring(1)}
                                setup_name(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                            }} value={up_name} style={{alignSelf:'end'}}>
                        </input>
                        <label style={{color:bgr==='black'?'lime':'darkgreen'}}>About 📝</label>
                        <input onChange={(e)=>
                            {
                            if(e.target.value[0]===' '){e.target.value=e.target.value.substring(1)}
                            setup_bio(e.target.value)
                            }} value={up_bio} style={{alignSelf:'end'}}>
                        </input>
                        <button onClick={()=>
                            {
                                if(up_user.length>0 && up_user.length<13 && up_name.length>0 && up_name.length<13 && up_bio.length>0 && up_bio.length<21)
                                    {update_info(up_user,up_name,up_bio)}
                                else{alert("Username,Profile Name Range:1-12 and About Range:1-20")
                                }
                            }} id="save">Save
                        </button>
                    </div>
                    <div className='settings_section' style={{display:settings_section}} >
                        <i style={{alignSelf:'center',paddingTop:'30px',color:bgr==='black'?'lime':'darkgreen'}} class='fas fa-user'></i>
                        <label style={{color:bgr==='black'?'lime':'darkgreen'}}>Change Password 🔒</label>
                        <input onChange={(e)=>setpass(e.target.value.replace(' ',''))} value={pass} style={{alignSelf:'end'}}></input>
                        <label style={{color:bgr==='black'?'lime':'darkgreen'}}>Background Theme 🎨</label>
                        <select value={bgr} style={{ alignSelf:'end',color:'black'}} onChange={(e)=>setbg(e.target.value)} >
                            <option  value="white">Light</option>
                            <option  value="yellow">Yellow</option>
                            <option  value="black">Dark</option>
                        </select>
                        <label style={{color:bgr==='black'?'lime':'darkgreen'}}>Read More 👉</label>
                        <a href='https://github.com/learner763/Whatsupp/#readme' style={{color:bgr==='black'?'white':'darkgreen'}}>🔗Documentation</a>
                        <button onClick={()=>
                            {
                                if(pass.length>0 && pass.length<13){update_settings(pass,bgr)}
                                else{alert("Password Range:1-12")}
                            }} id="save">Save
                        </button>
                    </div>
                </div>
                <div className='people_section' >
                    <span id="youmayknow" style={{fontWeight:'bold', display:'flex', justifySelf:'center', alignSelf:'center',color:bgr==='black'?'white':'darkgreen'}}><i style={{marginTop:'2.5px'}} id="refresh_people" class="fas fa-sync"></i>People you may know!</span>
                    <aa style={{display:'flex',justifyContent:'center',width:'100%'}}>
                        <input placeholder='Search ...' value={search_value} 
                        onChange={(e)=>
                            {
                                if(e.target.value[0]===' '){e.target.value=e.target.value.substring(1)}
                                if(e.target.value.length>12){e.target.value=e.target.value.slice(0,12)}
                                set_search_value(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                            }}
                        style={{ display:'flex',width:'200px',justifySelf:'center',alignSelf:'center',borderRadius:'5px',border:'1px solid darkgreen',fontSize:'20px'}}></input>
                        <button onClick={()=>set_search_value('')} style={{cursor:'pointer', fontSize:'20px',borderRadius:'5px',border:'1px solid darkgreen',backgroundColor:'darkgreen',color:'white'}}>Clear</button>
                    </aa>
                    <span style={{display:no_match_msg, color:bgr==='black'?'white':'darkgreen',justifyContent:'center',alignItems:'center',fontWeight:'bold'}}>No match for '{search_value}'</span>
                    {info.map((a, index) => {
                        if (index < info.length / 2) {
                            w = w + 1; 
                            return (
                                <div className='userinfo' key={index} style={{display:search_filter[index]}}> 
                                    <div style={{display:search_filter[index],flexDirection:'column',justifySelf:'center',alignSelf:'center',alignItems:'center',justifyContent:'center',width:'260px',height:'160px',backgroundColor:'darkgreen',borderRadius:'20px',padding:'5px'}}>
                                    <i className='fas fa-user'>{info[index + w ]=== profile ? ` You ${status[index]==='(Online)' || status[index]==='(Typing...)'?'(Online)':''}`: `${status[index]==='(Online)' || status[index]==='(Typing...)'?'(Online)':''}`}</i>                                    
                                    <span className='connect_people' >{info[index + w ]}</span> 
                                    <span style={{fontWeight:'normal'}}>{info[index + w + 1]}</span>
                                    <button onClick={()=>
                                        {
                                            update_receiver(indices[index])
                                            receiver_again.current=indices[index]
                                            set_seen(indices[index])
                                        }
                                    } className='connect_buttons'><i className='fas fa-envelope'></i>Message</button>
                                    </div>
                                </div>
                            );
                        }
                        return null; 
                    })}
                </div>
            </div>
            <div className='msg_div' style={{display:disp}}>
                <span style={{display:reply_to.length>0 || msg_before_edit.length>0?'flex':'none',flexDirection:'column',backgroundColor:'darkgreen',color:'white'}}>
                    <label style={{marginLeft:'auto',cursor:'pointer',paddingRight:'5px',fontWeight:'bold',paddingTop:'5px'}} onClick={()=>{if(reply_icon==="flex"){set_reply('none');set_reply_to('')}if(edit_icon==="flex"){set_msg_value('');set_edit('none');document.getElementById('message').value='';document.getElementById('Send_Button').style.backgroundColor='#EEEEEE';document.getElementById('message').style.height='51px'}document.getElementsByClassName('chat_detail_section')[0].style.marginBottom=parseInt(document.getElementsByClassName('chat_detail_section')[0].marginBottom)-50+'px';}}>{reply_to.length>0?<i className='fas fa-solid fa-reply'></i>:msg_before_edit.length>0?<i className='fas fa-solid fa-pen'></i>:''}<i className="fas fa-times"></i></label>
                    <label style={{paddingBottom:'5px',paddingLeft:'5px',overflowX:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{msg_before_edit.length>0?'You : '+msg_before_edit.slice(msg_before_edit.indexOf(' ')+1,msg_before_edit.lastIndexOf(' ')-4):reply_to.length>0?(reply_to.startsWith('✔')?'You':info[indices.indexOf(receiver)*2])+' : '+ reply_to.slice(reply_to.indexOf(' ')+1,reply_to.lastIndexOf(' ')-4):''}</label>
                </span>
                <div>
                    <textarea id="message" style={{ scrollbarWidth:'none',resize:"none",paddingLeft:'5px',height:'51px',maxHeight:'97px'}} placeholder='Type...'
                    onChange={(e)=>
                    {
                        e.target.style.height='auto';
                        e.target.style.height=e.target.scrollHeight+'px';
                        console.log(e.target.style.height)
                        if(e.target.scrollHeight<60){document.getElementsByClassName('chat_detail_section')[0].style.marginBottom='70px'}
                        else if(e.target.scrollHeight>60 && e.target.scrollHeight<85){document.getElementsByClassName('chat_detail_section')[0].style.marginBottom='95px'}
                        else {document.getElementsByClassName('chat_detail_section')[0].style.marginBottom='120px'}
                        document.getElementById('message').value=document.getElementById('message').value.replace(/^\s+/, "");
                        if(document.getElementById('message').value==='')
                        {
                            document.getElementById('Send_Button').style.backgroundColor='#EEEEEE'
                        }
                        else{document.getElementById('Send_Button').style.backgroundColor='lime'}
                        typing_status()
                    }
                    }></textarea>
                    <button id="Send_Button" style={{color:'white',margin:'5px',borderRadius:'7px'}}
                        onClick={()=>{
                        if(document.getElementById('message').value!='')
                        {
                        if(edit_icon==='none'){Send(document.getElementById('message').value)};
                        if(edit_icon==='flex'){write_edit(document.getElementById('message').value)}
                        document.getElementById('message').value=''
                        document.getElementById('message').style.height='51px'
                        document.getElementById('Send_Button').style.backgroundColor="#EEEEEE"}}} ><i className='fas fa-arrow-up'></i></button>
                </div>
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
