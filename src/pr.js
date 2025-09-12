let seen_time=[3,4,null]
let not_seen=seen_time.filter(x=>x===null)

seen_time=seen_time.filter(x=>x!==null)
let news=seen_time.concat(not_seen)
console.log(news)