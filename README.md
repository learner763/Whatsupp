
# Whatsupp - Online Chatting App
## Application Link
https://whatsupp-chat.vercel.app/

<code>
To run locally,execute following commands.
Navigate to any directory.
git clone https://github.com/learner763/Whatsupp.git Whatsupp
cd Whatsupp
npm install
npm run build
cd api
npm install
node index.js
Open http://localhost:8080/

</code>

## Tech Stack 
**FrontEnd**- React JS

**BackEnd**- Express JS

**Database**- Postgresql

**Real Time Communication Layer**- Firebase 

## Components
### Login Page 
- LogIn and SignUp features.
- Account Password Recovery.
### Profile Page 
- You can add your personal info.
### Home Page 
- **Chat Section**
    - Chats are **not encrypted** for now.
    - Chats are **sorted** from latest to oldest ones.
    - **Blue Tick and SeenAt** features are implemented to tell you that receiver has read the message along with the time when it was read.
    - You **get notified** on application when you receive unread messages.
    - You can **Edit,Delete and Reply** to certain messages.
    - **Date and Time** show when did the conversations happended.
    - Edited messages would appear with edited label.
    
- **Settings Section:** You can change account password and background theme.
- **Profile Section:** To update your personal info and account username.
- **Add Account:** You can sign up to multiple accounts.
- **People Section:** Shows list of people who have joined this platform,you can search and start chatting with them.


## Unique Features
There are three such features that are **not implemented in actual Whatsapp** but you are able to see here.
- When you delete a message from a conversation ,it is deleted from receiver's side as well without notifying that person like *This message was deleted*.
- Now consider a message is sent while replying or qouting a certain message.If that qouted message is edited or deleted,then that change is reflected where it is qouted or replied to.
## Navigation Notables
- You must fill and submit information while signing up on login and profile pages before going to home page otherwise you will be redirected back.
- Once you have signed up on this application, you dont have to login again and you will be redirected to home page. 
- Use icons on home page to navigate between its different sections and not back button.
## Live Status
- You can view whether other person is online,typing a message to you and person's last active time.


