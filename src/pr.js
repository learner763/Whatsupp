

let dobreak=false
let previous=[["a",["✔hello",' hey',"✔hey"]],['b',[" mee","✔mee",' dsj']]]
let reply_info=[[],[]]
let msgs=[{from:'me',to:'a',replied_to:' hey'},{from:'me',to:'b',replied_to:' mee'}]
for(let i=0;i<msgs.length;i++)
{
    for(let j=0;j<previous.length;j++)
    {
        if(previous[j][0]===msgs[i].to)
        {
            for(let k=0;k<previous[j][1].length;k++)
            {
                if(previous[j][1][k].endsWith(msgs[i].replied_to))
                {
                    if(previous[j][1][k].startsWith('✔'))
                    {
                        reply_info[j].push(['flex','You','msg'])
                    }
                    else if(previous[j][1][k].startsWith(' '))
                    {
                        reply_info[j].push(['flex','other','msg'])
                    }
                }
                else
                {
                    reply_info[j].push(['none','',''])
                    
                }
            }
        }
        
    }

}
for(let i=0;i<msgs.length;i++)
    {
        for(let j=0;j<previous.length;j++)
        {
            if(previous[j][0]===msgs[i].from)
            {
                for(let k=0;k<previous[j][1].length;k++)
                {
                    if(previous[j][1][k].endsWith(msgs[i].replied_to))
                    {
                        if(previous[j][1][k].startsWith('✔'))
                        {
                            reply_info[j].push(['flex','You','msg'])
                        }
                        else if(previous[j][1][k].startsWith(' '))
                        {
                            reply_info[j].push(['flex','other','msg'])
                        }
                    }
                    else
                    {
                        reply_info[j].push(['none','',''])
                    }
                }
            }
        }
    
    }
console.log(reply_info)