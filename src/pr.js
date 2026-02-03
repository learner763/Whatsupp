let message='https://chatgpt.com/c/6981f50e-1034-8320-9385-3bacd32e2db8'
const urlRegex = /(https?:\/\/[^\s]+)/g
let portions=message.split(urlRegex)
console.log(portions)