let f="Mon-Jan-11-2025-10:32:21-PM"
{value[1][value[1].length-1].slice(4,value[1][value[1].length-1].length).replace(new Date().getFullYear()+'-',"").replace(value[1][value[1].length-1].slice(value[1][value[1].length-1].lastIndexOf(':'),value[1][value[1].length-1].length-3),'')}
console.log(f)
