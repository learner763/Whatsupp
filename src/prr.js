let previous=[['0',['f',' g']]]
let time_stamp='00:00'
previous[0][1][previous[0][1].length-1]=previous[0][1][previous[0][1].length-1].replace(`${previous[0][1][previous[0][1].length-1].slice(previous[0][1][previous[0][1].length-1].lastIndexOf(' ')+1,previous[0][1][previous[0][1].length-1].length)}`,time_stamp)
console.log(previous)