const express = require("express")
const fs = require("fs");
const multiparty = require("multiparty")
const router = express.Router();
const HOSTNAME = require('../../server').HOSTNAME
const uploadDir = `${__dirname}/uploadFile`
const multiparty_upload = (req, auto) => {
    typeof auto !== "boolean" ? auto = false : null

    const config = {
        maxFieldSize: 200 * 1024 * 1024
    }

    if (auto) config.uploadDir = uploadDir;

    return new Promise(async (resolve, reject) => {
        // delay imitation
        new multiparty.Form(config).parse(req, (err, fields, files) => {
            console.log(req.body)
            // console.log(fields)
            if (err) {
                reject(err);
                return;
            }
            console.log(fields)
            resolve({
                fields, files
            })
            console.log(files)

        })
    })

}
// router.get("/already", (req, res) => {
//     res.json({ msg: "login" });
//     console.log("Hi")
// })
// router.get("/chuck_merge", (req, res) => {
//     res.json({ msg: "login" });
//     console.log("Hi")
// })
router.post("/single_file", async (req, res) => {
    try {

        const { files } = await multiparty_upload(req, true);
        
        let file = (files.file && files.file[0]) || {};
     
        res.send({
            code: 0,
            codeText: 'upload success',
            originalFilename: file.originalFilename,
            servicePath: file.path.replace(__dirname, HOSTNAME)
        })
    } catch (err) {
       
        res.send({
            code: 1,
            codeText: err
        })
    }
})
module.exports = router