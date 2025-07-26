let chat={"chat_with":["3:3"],"3":["3:3"],"4":["3:3"]};
let previous=3
let username=4
for(let i=0;i<Object.keys(chat).length;i++)
    {
        if(Array.isArray(chat[Object.keys(chat)[i]]) && Object.keys(chat)[i]!="chat_with") 
        {
            for(let j=0;j<chat[Object.keys(chat)[i]].length;j++)
            {
                if(chat[Object.keys(chat)[i]][j].startsWith(`${previous}`))
                {
                    chat[Object.keys(chat)[i]][j]=chat[Object.keys(chat)[i]][j].replace(`${previous}`,`${username}`);
                }
            }
        }
    }
console.log(chat);