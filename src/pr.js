for(let j=0;j<msgs.length;j++)
{
    if(previous[i][0]=== msgs[j].to)
    {
        for(let k=0;k<previous[i][1].length;k++)
        {
            if(previous[i][1][k].startsWith('✔✔✔✔')===false)
            {
                if(previous[i][1][k].slice(previous[i][1][k].indexOf(' ')+1,previous[i][1][k].lastIndexOf(" ")-4)===msgs[j].text)
                {
                    if(msgs[j].seen===true && !msgs[j].delete)
                    {
                        console.log('already seen')
                        if(previous[i][1][k].startsWith('✔✔'))
                        {
                            skip=true
                            previous[i][1][k]=`✔✔${previous[i][1][k]}`
                            break
                        }
                        
                    }
                }
            }
        }
        
    }
    
    if(skip){continue}
}