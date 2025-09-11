let previous=[['d',[
    'September 10,2025',
    '✔✔ bhb bn      2025-09-10T18:25:24.044Z',
    'Today',
    '✔✔ bhb bn      2025-09-11T18:25:24.044Z'
  ]]]
let months=['January','February','March','April','May','June','July','August','September','October','November','December']
for(let i=0;i<previous.length;i++)
{
    for(let j=0;j<previous[i][1].length;j++)
    {
        
        if(previous[i][1][j].startsWith(' ')===true && previous[i][1][j].startsWith('✔✔')===true)
        {
            console.log(previous[i][1][j])
            let present_date=new Date(previous[i][1][j].slice(previous[i][1][j].lastIndexOf(' ')+1,previous[i][1][j].length)).toLocaleDateString()
        if(present_date.slice(present_date.indexOf('/')+1,present_date.lastIndexOf('/'))!==String(new Date().getDate()))
        {present_date=present_date.replace(present_date.slice(0,present_date.indexOf('/')),months[Number(present_date.slice(0,present_date.indexOf('/')))-1])
        present_date=present_date.replace(present_date[present_date.indexOf('/')],' ')
        present_date=present_date.replace(present_date[present_date.lastIndexOf('/')],',')
        }
        else{present_date='Today'}
        if(previous[i][1].includes(present_date)===false)
        {
            previous[i][1].splice(j,0,present_date)
        }
    }}
}
console.log(previous)
