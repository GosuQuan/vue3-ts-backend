const express = require("express")
const router = express.Router();
router.get("/already", (req, res) => {
    res.json({ msg: "login" });
    console.log("Hi")
})
router.get("/chuck_merge", (req, res) => {
    res.json({ msg: "login" });
    console.log("Hi")
})
router.post("/single_file",(req,res)=>{
   res.json({
    code:0,
    codeText:"ok"
   })
   console.log("Hi")
})


module.exports = router