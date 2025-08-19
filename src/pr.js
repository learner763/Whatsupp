let r=new Date().toISOString()

setTimeout(() => {
    console.log(r> new Date().toISOString());
}, 2000);

