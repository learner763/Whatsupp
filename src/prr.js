let a=[{a:3,b:4}]
console.log(a[0].a);
let d=a[0]
console.log(d);
let keys=Object.keys(d);
console.log(keys);
for(let i=0;i<keys.length;i++)
{
    console.log(d[keys[i]]);
}
