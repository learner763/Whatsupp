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
            //'postgresql://neondb_owner:npg_sw58OFiXJGeC@ep-odd-truth-a5etezja-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
/*const firebaseConfig = {
  apiKey: "AIzaSyAs1fECOFgYMffMOSYexcish46IRyUozSw",
  authDomain: "aaaa-90493.firebaseapp.com",
  databaseURL: "https://aaaa-90493-default-rtdb.firebaseio.com",
  projectId: "aaaa-90493",
  storageBucket: "aaaa-90493.firebasestorage.app",
  messagingSenderId: "845602969471",
  appId: "1:845602969471:web:f6fa7e87657a68ff336c4a",
  measurementId: "G-FFDYCCC490"
};*/