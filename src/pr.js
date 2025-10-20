let a=[3,4,5]
for(let i=0;i<a.length;i++)
{
    if(a[i]===4)
    {
        a.splice(i,1)
    }
    console.log(a)
}   
console.log(a)