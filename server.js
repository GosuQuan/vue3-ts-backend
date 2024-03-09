const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const app = express();
const port = process.env.PORT || 4001;

const db = require("./config/keys.js").mongoURI
const users  = require('./routes/api/user.js')
mongoose.connect(db)
    .then(() => console.log("MongoDB connected!"))
    .catch((err) => {
        console.log(err)
    })
app.get("/", (req, res) => {
    res.send("helloworld")
    console.log("Hi")
})
//使用body-Parser中间件 注意顺序！！！
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json())
//使用中间件 routes
app.use("/api/users",users)



app.listen(port, () => {
    console.log(`server running on port ${port}`);

})