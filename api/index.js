import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import validator from 'validator';
import nodemailer from 'nodemailer';
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ storage:multer.memoryStorage() });
dotenv.config(
    {path: path.resolve(__dirname, '../.env')}
);
cloudinary.config({
    cloud_name: "dcaqvqzaf",
    api_key: "879365262424543",
    api_secret: "yTZepiWSl8MEUfZYDFq8Od_bz0Q",
});
const transporter=nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:'whatsuppchatapp@gmail.com',
        pass:'higsrxaeudsbrsab'
    }
})

const app = express();

const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));
app.use(express.json());

app.post('/accounts', (req, res) => {
    pool.query('select * from public.users', (err, results) => {
        if (err) {}
        else res.json(results.rows);
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(buildPath, 'index.html'), {
        headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
});

const pool = new pkg.Pool({
    connectionString: process.env.POSTGRES_URL
});

pool.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to PostgreSQL');
});

function generatetoken()
{
    let chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let char=''
    for(let i=0;i<20;i++)
    {
        char+=chars.charAt(parseInt(Math.random()*chars.length))
    }
    return char
}

app.post("/login",async (req, res) => {
    const { email, password,bt,token } = req.body;
    if(bt=="Log In")   
    {
        let results1=await pool.query("select * from public.users where email=$1", [email])
        if (results1.rows.length>0)
        {
            let check=await bcrypt.compare(password,results1.rows[0].password)
            console.log(check)
            if(check){
                if (results1.rows[0].token===token)
                {
                    return res.json({token:token,verified:true,success:true})
                }
                else{
                    let otp=parseInt(Math.random()*1000000)
                    var hashed_otp=await bcrypt.hash(String(otp),10)
                    await transporter.sendMail(
                    {
                        from:process.env.EMAIL,
                        to:email,
                        subject:'WhatsUpp OTP',
                        text:`Your WhatsUpp Account OTP is ${otp}`
                    })
                    let results3=await pool.query("update public.users set otp=$1,lastlogin=$2 where email=$3", [hashed_otp,new Date(),email]) 
                    return res.json({email:email,password:password,verfied:false,success:true})
                }
            }
            else{
                return res.json({success:false})
            }
        }
        else{
            return res.json({success:false})
        }   
    }
    else if(bt=="Sign Up")
    {
        var results2=await pool.query("select * from public.users where email=$1 union all select * from public.users where index=$1", [email])
        if(results2.rows.length>0){return res.json({success:false,duplicate:true});}
        else{     
            if(!validator.isEmail(email)){return res.json({success:false,invalid:true});}
            let otp=parseInt(Math.random()*1000000)
            var hashed_otp=await bcrypt.hash(String(otp),10)
            var hashed_password=await bcrypt.hash(String(password),10)
            let token=generatetoken()
            await transporter.sendMail(
            {
                from:process.env.EMAIL,
                to:email,
                subject:'WhatsUpp OTP',
                text:`Your WhatsUpp Account OTP is ${otp}`
            })
            let results3=await pool.query("insert into public.users(email,password,index,token,otp,lastlogin,bg,profilepicture) values($1,$2,$3,$4,$5,$6,$7,$8)", [email,hashed_password,email,token,hashed_otp,new Date(),'white',''])
            if(results3.rowCount===1){return res.json({success:true,password:password,email:email});}  
        }
    }   
});

app.post('/verify_otp',async (req,res)=>
{
    const {email,otp}=req.body
    let results=await pool.query(`select * from public.users where email=$1`,[email])
    let check=await bcrypt.compare(String(otp),results.rows[0].otp)
    if(check && new Date().getTime()-new Date( results.rows[0].lastlogin).getTime()<121000){return res.json({success:true,token:results.rows[0].token})}
    else if(!check){ return res.json({success:false,invalid:true})}
    else{ return res.json({success:false,expired:true})}

})

app.post("/personal", (req, res) => {
    const { token, name,bio } = req.body;
    pool.query("update public.users set name=$1,bio=$2,nameatfirst=$3 where token=$4", [name,bio,name,token], (err, results) => {   
        if(results.rowCount===1){return res.json({success:true});} 
    });
});

app.post("/user_in_table", (req, res) => {
    const { email } = req.body;
    pool.query("insert into public.chats(chat_with) values($1) on conflict(chat_with) do nothing;", [email], (err1, results1) => 
    {
        if(results1.rowCount===1)
        {
            pool.query(`alter table public.chats add column if not exists "${email}" text[];`, (err2, results2) => {
                if(results2.command==='ALTER'){return res.json({success:true});}
            });
        }
    });
})

app.post('/user_data',(req,res)=>
{
    const {email,token}=req.body
    let log_in=false
    pool.query(`select "${email}" from public.chats`,(err,results)=>
    {
        if(!results)
        {
            log_in=false
        }
        else{log_in=true}
    })
    if(email)
    {
        pool.query('select * from public.users where email=$1',[email],(err,results)=>
        {
            return res.json({result:results.rows,log_in:log_in})
        })
    }
    else if(token){
        pool.query('select * from public.users where token=$1',[token],(err,results)=>
        {
            console.log(results.rows)
            return res.json({result:results.rows,log_in:log_in})
        })
    }
    else{return res.json({result:[]})}
})

app.post('/get_messages',(req,res)=>
{
    let messages={}
    let frontend_messages=[]
    const {email}=req.body;
    pool.query(`select "${email}",chat_with from public.chats `, (err1, results) => {
        pool.query(`select * from public.chats where chat_with=$1`,[email], (err2, results2) => {
            if( err1 || err2) {}
            let a_list=results.rows
            for(let i=0;i<a_list.length;i++)
            {
                if(Array.isArray(a_list[i][email]))
                {
                    messages[a_list[i]['chat_with']]=a_list[i][email];
                }
            }
            let a_list2=results2.rows[0]
            for(let i=0;i<Object.keys(a_list2).length;i++)
            {
                if(Array.isArray(a_list2[Object.keys(a_list2)[i]]) && Object.keys(a_list2)[i]!="chat_with")
                {
                    messages[Object.keys(a_list2)[i]]=a_list2[Object.keys(a_list2)[i]];
                }
            }
            for(let i=0;i<Object.keys(messages).length;i++)
            {
                let sent_received=[]
                frontend_messages.push(Object.keys(messages)[i])
                for(let j=0;j<messages[Object.keys(messages)[i]].length;j++)
                {
                    if(messages[Object.keys(messages)[i]][j].startsWith(`${email}`))
                    {
                        sent_received.push(messages[Object.keys(messages)[i]][j].replace(`${email}:`,'✔✔'))
                    }
                    if([Object.keys(messages)[i]]!=email)
                    {
                        if(messages[Object.keys(messages)[i]][j].startsWith(`${Object.keys(messages)[i]}`))
                        {
                            sent_received.push(messages[Object.keys(messages)[i]][j].replace(`${Object.keys(messages)[i]}:`,''))
                        }
                    }
                }
                frontend_messages.push(sent_received);
            }
            for(let i=frontend_messages.length-1;i>=1;i-=2)
            {
                if(Array.from(frontend_messages[i]).length===0)
                {
                    frontend_messages.splice(i-1,2)
                }
            }
            for(let j=0;j<(frontend_messages.length-2)/2;j++)
            {
                for(let i=1;i<frontend_messages.length-2;i+=2)
                {
                    if(new Date(frontend_messages[i+2][frontend_messages[i+2].length-1].slice(frontend_messages[i+2][frontend_messages[i+2].length-1].lastIndexOf(' ')+1,frontend_messages[i+2][frontend_messages[i+2].length-1].length))
                    >new Date(frontend_messages[i][frontend_messages[i].length-1].slice(frontend_messages[i][frontend_messages[i].length-1].lastIndexOf(' ')+1,frontend_messages[i][frontend_messages[i].length-1].length)))
                    {
                        let temp=frontend_messages[i]
                        frontend_messages[i]=frontend_messages[i+2]
                        frontend_messages[i+2]=temp;
                        temp=frontend_messages[i-1]
                        frontend_messages[i-1]=frontend_messages[i+1]
                        frontend_messages[i+1]=temp;
                    }
                }
            }
            console.log(frontend_messages)
            res.json(frontend_messages);
        })
    })
})

app.post("/save_info", (req, res) => {
    const { token, name,bio } = req.body;
    pool.query('select * from public.users where name=$1',[name],(err,results)=>
    {
        if(results.rows.length===0 || results.rows[0].token===token)
        {
            pool.query("update public.users set name=$1,bio=$2 where token=$3", [name,bio,token], (err, results) => {   
                if(results.rowCount===1){return res.json({success:true});} 
            });
        }
        else{
            return res.json({success:false});
        }
    })
    
});

app.post("/save_settings",async (req, res) => {
    const { token,password,change, bg } = req.body;
    pool.query("update public.users set bg=$1 where token=$2", [bg,token])
    if(change && password!=='')
    {
        let hashed_password=await bcrypt.hash(String(password),10)
        let new_token=generatetoken()
        let results=await pool.query("update public.users set password=$1,token=$2 where token=$3", [hashed_password,new_token,token]) 
        if(results.rowCount===1){return res.json({success:true,new_token:new_token});}
    }
    else{
        return res.json({success:true});
    }
});

app.post("/forpass",async (req, res) => {
    const { email,token } = req.body;
    let results=await pool.query("select * from public.users where email=$1", [email])
    if(results)
    {
        if(results.rows[0].token===token){ return res.json({success:true,token:token})}
        else{
            let otp=parseInt(Math.random()*1000000)
            var hashed_otp=await bcrypt.hash(String(otp),10)
            await transporter.sendMail(
            {
                from:process.env.EMAIL,
                to:email,
                subject:'WhatsUpp OTP',
                text:`Your WhatsUpp Account OTP is ${otp}`
            })
            let results3=await pool.query("update public.users set otp=$1,lastlogin=$2 where email=$3", [hashed_otp,new Date(),email]) 
            return res.json({email:email,success:true})
                
        }
    }
    else{ return res.json({success:false})}
    
});

app.post('/save_msg',(req,res)=>
{
    const {from,to,message,time}=req.body;
    pool.query(`select "${from}" as chat from public.chats where chat_with=$1 
                union all 
                select "${to}" from public.chats where chat_with=$2`,[to,from],(err,results)=>
        {
            if((results.rows[0].chat==null && results.rows[1].chat==null) || results.rows[0].chat==null || from==to)
            {
                pool.query(`update public.chats set "${to}"= coalesce("${to}", ARRAY[]::text[]) || $2  where chat_with=$1;`,[from,[`${from}: ${message}     ${time}`]],(err1,results1)=>
                {
                    if(results1.rowCount===1){res.json({success:true})}
                    else if(err1){res.json({success:false})}
                    else{res.json({success:false})}
                })
            }
            else if(results.rows[1].chat==null)
            {
                pool.query(`update public.chats set "${from}"= coalesce("${from}", ARRAY[]::text[]) || $2  where chat_with=$1;`,[to,[`${from}: ${message}     ${time}`]],(err2,results2)=>
                {
                    if(results2.rowCount===1){res.json({success:true})}
                    else if(err2){res.json({success:false})}
                    else{res.json({success:false})}
                })
            }
        })
})

app.post('/delete_msg',(req,res)=>
{
    const {from,to,message}=req.body;
    let updated_msg=message.replace(message.slice(0,message.indexOf(' ')),`${from}:`)
    pool.query(`update public.chats set "${from}"=array_remove("${from}",$1) where chat_with=$2 and "${from}" is not null`,[updated_msg,to],(err1,results1)=>
    {
        if(results1.rowCount===0)
        {
            pool.query(`update public.chats set "${to}"=array_remove("${to}",$1) where chat_with=$2 and "${to}" is not null`,[updated_msg,from],(err2,results2)=>
            {
                if(results2.rowCount===1){res.json({success:true})}
            })
        }
        else if(results1.rowCount===1){res.json({success:true})}
    })
})

app.post('/edit_message',(req,res)=>
{
    const {from,to,text,original_msg}=req.body
    let updated_text=`${from}: ${text}     ${original_msg.slice(original_msg.lastIndexOf(' ')+1,original_msg.length)}`
    let original=`${from}: ${original_msg.slice(original_msg.indexOf(' ')+1,original_msg.length)}`
    pool.query(`update public.chats set "${from}"=array_replace("${from}",$1,$2) where chat_with=$3 and "${from}" is not null`,[original,updated_text,to],(err1,results1)=>
    {
        if(results1.rowCount===0)
        {
            pool.query(`update public.chats set "${to}"=array_replace("${to}",$1,$2) where chat_with=$3 and "${to}" is not null`,[original,updated_text,from],(err2,results2)=>
            {
                if(results2.rowCount===1){res.json({success:true})}
            })
        }
        else if(results1.rowCount===1){res.json({success:true})}
    })
res.json({success:true})
})

app.post('/upload_pic',upload.single('file'), (req,res)=>
{
    console.log(req.file)
    cloudinary.uploader.upload_stream({
        folder:'my_app_assets'
    },(err,results)=>
    {
        if(results.secure_url)
        {
            pool.query('update public.users set profilepicture=$1 where token=$2',[results.secure_url,req.body.token],(err2,results2)=>
            {
                if(req.body.previous_dp!=='dp.png')
                {
                    cloudinary.uploader.destroy(`my_app_assets/${req.body.previous_dp.slice(req.body.previous_dp.lastIndexOf('/')+1,req.body.previous_dp.lastIndexOf('.'))}`,(err3,results3)=>
                    {
                        console.log(results3)
                        if(results3.result)
                        {
                            if(results2.rowCount===1){ res.json({url:results.secure_url})}
                            else{res.json({success:false})}
                        }
                    })
                }
                else{
                    if(results2.rowCount===1){ res.json({url:results.secure_url})}
                    else{res.json({success:false})}
                }
            })
        }
        else{
            res.json({success:false})
        }
    }).end(req.file.buffer);
    
})

app.post('/remove_pic',(request,responce)=>
{
    console.log(request.body)
    cloudinary.uploader.destroy(`my_app_assets/${request.body.public_id}`,(err,res)=>
    {
        if(res.result)
        {
            pool.query('update public.users set profilepicture=$1 where token=$2',['',request.body.token],(error,results)=>
            {
                if(results.rowCount===1){responce.json({success:true})}
            })
        }
    })
})

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
