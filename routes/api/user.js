//@login & register

const express = require("express")
const router = express.Router();
const User = require("../../models/User")
const bcrypt = require("bcrypt")
router.get("/test", (req, res) => {
    res.json({ msg: "login" });
})

router.post("/register", (req, res) => {
    User.findOne({ email: req.body.email }).then(
        user => {
            if (user) {
                return res.status(400).json({ email: "邮箱已被注册" })
            }
            const newUser = new User({
                name: req.body.name,
                password: req.body.password,
                email: req.body.email,
            })
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser.save().then(user => res.json(user)).catch(err => console.log(err));
                    // Store hash in your password DB.
                });
            });
        }
    )

})

module.exports = router 
