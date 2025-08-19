import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const app = express();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serve static files from the React app's build folder
const buildPath = path.join(__dirname, '../build');

app.use(express.static(buildPath));

app.use(express.json());

// API route
app.get('/accounts', (req, res) => {
    pool.query('SELECT email,name,bio,password,bg,index FROM public.users', (err, results) => {
        if (err) {}
        else res.json(results.rows);
    });
});

// Catch-all route to serve React's index.html
app.get('*', (req, res) => {
    res.sendFile(path.resolve(buildPath, 'index.html'), {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  });

// PostgreSQL Connection
const pool = new pkg.Pool({
    connectionString: 'postgresql://neondb_owner:npg_sw58OFiXJGeC@ep-odd-truth-a5etezja-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require',
});

pool.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to PostgreSQL');
});

// POST route for /api/data
app.post("/login", (req, res) => {
    const { email, password,bt } = req.body;
    

    if(bt=="Log In")    
        pool.query("select * from public.users where email=$1 and password=$2", [email,password], (err, results) => {
            if (err) {}
            else res.json(results.rows);
            
        });

    else if(bt=="Sign Up")
        pool.query("select * from public.users where email=$1", [email], (err, results) => {
            if (err) {}
            if(results.rows.length>0){res.json({success:false});}
            else{
                
                pool.query("insert into public.users(email,password) values($1,$2)", [email,password], (err, results) => {
                    if (err) {
                        return res.status(500).send('Database error');
                    }
                    else 
                    {
                        pool.query('select index from public.users',(err,results)=>
                        {
                            let array=[]
                            for(let i=0;i<results.rows.length;i++)
                            {
                                array.push(results.rows[i].index)
                            }
                            pool.query(`update public.users set index=${Math.max(...array)+1} where email=$1`,[email])
                        });
                        res.json({success:true});
                    }
                });
                
            }
        });

      
});

app.post("/personal", (req, res) => {
    const { username, name,bio } = req.body;
    pool.query("update public.users set name=$1,bio=$2 where email=$3", [name,bio,username], (err, results) => {   
        if (err) {console.log(4)}
        else res.json({success:true}); 
    });
});
app.post("/user_in_table", (req, res) => {
    const { username } = req.body;
    pool.query("insert into public.chats(chat_with) values($1) on conflict(chat_with) do nothing;", [username], (err, results) => {
    });
    pool.query(`alter table public.chats add column if not exists "${username}" text[];`, (err, results) => {
        if (err) {console.log(err)}
    });
    res.json({success:true});

})
app.post('/get_messages',(req,res)=>
{
    let messages={}
    let frontend_messages=[]
    const {username}=req.body;
    pool.query(`select "${username}",chat_with from public.chats `, (err, results) => {
        pool.query(`select * from public.chats where chat_with=$1`,[username], (err, results2) => {
            let a_list=results.rows
            for(let i=0;i<a_list.length;i++)
            {
                if(Array.isArray(a_list[i][username]))
                {
                    messages[a_list[i]['chat_with']]=a_list[i][username];
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
                    if(messages[Object.keys(messages)[i]][j].startsWith(`${username}`))
                    {
                        sent_received.push(messages[Object.keys(messages)[i]][j].replace(`${username}:`,'✔✔'))
                    }
                    if([Object.keys(messages)[i]]!=username)
                    {
                        if(messages[Object.keys(messages)[i]][j].startsWith(`${Object.keys(messages)[i]}`))
                        {
                            sent_received.push(messages[Object.keys(messages)[i]][j].replace(`${Object.keys(messages)[i]}:`,''))
                        }
                    }
                }
                frontend_messages.push(sent_received);
            }
            for(let j=0;j<(frontend_messages.length-2)/2;j++)
            {
                for(let i=1;i<frontend_messages.length-2;i+=2)
                {
                    if(new Date(frontend_messages[i+2][frontend_messages[i+2].length-1].slice(frontend_messages[i+2][frontend_messages[i+2].length-1].lastIndexOf(' ')+1,frontend_messages[i+2][frontend_messages[i+2].length-1].length).replaceAll('-',' '))
                    >new Date(frontend_messages[i][frontend_messages[i].length-1].slice(frontend_messages[i][frontend_messages[i].length-1].lastIndexOf(' ')+1,frontend_messages[i][frontend_messages[i].length-1].length).replaceAll('-',' ')))
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
    const { previous,username, name,bio } = req.body;

    pool.query("select * from public.users where email=$1", [username], (err, results) => {
        if (err) {}
        if(results.rows.length>0)
        {
            if(username==previous)
            {pool.query("update public.users set name=$1,bio=$2 where email=$3", [name,bio,previous], (err, results) => {});}
            else
            {res.json({success:false});}
        }
        else{
            pool.query("update public.chats set chat_with=$1 where chat_with=$2;", [username,previous], (err, results) => {
            });
            pool.query(`alter table public.chats rename column "${previous}" to "${username}";`, (err, results) => {
                if (err) {console.log(err)}
            });
            pool.query("update public.users set name=$1,bio=$2,email=$3 where email=$4", [name,bio,username,previous], (err, results) => {   
                if (err) {console.log(4)}
                res.json({success:true})

            });
            
            
        }
    });
    
});
app.post('/message_change',(req,res)=>
{
    let chat={}
    const {previous,username}=req.body;
    pool.query("select * from public.chats where chat_with=$1;",[username],(err,results)=>
    {
        chat=results.rows[0]
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
        let users=Object.keys(chat)
        for(let i=0;i<users.length;i++)
            {
                if(users[i]!="chat_with")
                {
                    pool.query(`update public.chats set "${users[i]}"= $1 where chat_with=$2`,[chat[users[i]],username],(err,results)=>
                    {
                        if(err){res.json(err)}
                    })
                }
        
            }
    });

    
}
);
app.post("/save_settings", (req, res) => {
    const { username,password, bg } = req.body;
    pool.query("update public.users set password=$1,bg=$2 where email=$3", [password,bg,username], (err, results) => {   
        if (err) {console.log(4)}
        else res.json({success:true}); 
    });
});
app.post("/forpass", (req, res) => {
    const { email } = req.body;

    pool.query("select * from public.users where email=$1", [email], (err, results) => {
        if (err) {}
        else res.json(results.rows);
    });
});
app.post('/save_msg',(req,res)=>
{
    const {from,to,message}=req.body;
    
    pool.query(`select "${from}" as chat from public.chats where chat_with=$1 
                union all 
                select "${to}" from public.chats where chat_with=$2`,[to,from],(err,results)=>
    {
        
            if((results.rows[0].chat==null && results.rows[1].chat==null) || results.rows[0].chat==null || from==to)
            {
                pool.query(`update public.chats set "${to}"= coalesce("${to}", ARRAY[]::text[]) || $2  where chat_with=$1;`,[from,[`${from}: ${message}     ${new Date().toDateString().replaceAll(" ",'-')}-${new Date().getHours()<13?new Date().getHours():new Date().getHours()-12}:${new Date().getMinutes()}:${new Date().getSeconds()}-${new Date().getHours()<12?"AM":"PM"}`]])
            }
            else if(results.rows[1].chat==null)
            {
                pool.query(`update public.chats set "${from}"= coalesce("${from}", ARRAY[]::text[]) || $2  where chat_with=$1;`,[to,[`${from}: ${message}     ${new Date().toDateString().replaceAll(" ",'-')}-${new Date().getHours()<13?new Date().getHours():new Date().getHours()-12}:${new Date().getMinutes()}:${new Date().getSeconds()}-${new Date().getHours()<12?"AM":"PM"}`]])
            }
        
        
    })
    res.json({success:true});
})

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
