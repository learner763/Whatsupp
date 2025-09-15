let frontend_messages = ['d', [], 'y', [],'d', [], 'y', []];

for(let i=frontend_messages.length-1;i>=1;i-=2)
{
    if(Array.from(frontend_messages[i]).length===0)
    {
        frontend_messages.splice(i-1,2)
    }
}

console.log(frontend_messages); // []
