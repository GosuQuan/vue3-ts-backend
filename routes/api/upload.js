
const express = require("express")
const fs = require("fs")
const fsPromises = require('fs').promises;
const multiparty = require("multiparty");
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

            // console.log(fields)
            if (err) {
                reject(err);
                return;
            }

            resolve({
                fields, files
            })

        })
    })

}
//写入文件
const writeFile = (res, path, file, filename, stream) => {
    new Promise((rs, rj) => {
        if (stream) {
            try {
                let readStream = fs.createReadStream(file.path);
                let writeStream = fs.createWriteStream(path);
                readStream.pipe(writeStream)
                readStream.on('end', () => {
                    rs();
                    fs.unlinkSync(file.path);
                    res.send({
                        code: 0,
                        codeText: "upload success",
                        originalFilename: filename,
                        servicePath: path.replace(__dirname, HOSTNAME)
                    })
                })
            }
            catch (err) {
                rj(err);
                res.send({
                    code: 1,
                    codeText: err,
                })
            }
            return;
        }
        fs.writeFile(path, file, err => {
            if (err) {
                rj(err);
                res.sen({
                    code: 1,
                    codeText: err
                })
                return
            }
            rs();
            res.send({
                code: 0,
                codeText: "upload success",
                originalFilename: filename,
                servicePath: path.replace(__dirname, HOSTNAME)
            })

        })
    })
}
//get already upload file chunk
router.get("/upload_already", async (req, res) => {
    let { HASH } = req.query;
    let path = `${uploadDir}/${HASH}`,
        fileList = [];
    try {
        fileList = fs.readdirSync(path);
        fileList = fileList.sort((a, b) => {
            let reg = /_(\d+)/;
            return reg.exec(a)[1] - reg.exec(b)[1]
        })
        res.send({
            code: 0,
            codeText: '',
            fileList,
        })
    } catch (
    err
    ) {
        res.send({
            code: 1,
            codeText: err
        });
    }

})
router.post("/chunk_merge", async (req, res) => {
    let { HASH, count } = req.body;
    try {
        let { filename, path } = await merge(HASH, count);
        res.send({
            code: 0,
            codeText: "merge success",
            originalFilename: filename,
            servicePath: path.replace(__dirname, HOSTNAME)
        })
    } catch (err) {
        res.send({
            code: 1,
            codeText: err,
        })
    }
})
const Myexists = (path) => {
    return new Promise(resolve => {
        fs.access(path, fs.constants.F_OK, err => {
            if (err) {

                resolve(false);
                return;
            }
            resolve(true)
        })
    })
}
//uploadchunk
router.post("/upload_chunk", async (req, res) => {
    try {
        let {
            fields, files
        } = await multiparty_upload(req);

        let file = (files.file && files.file[0]) || {},
            filename = (fields.filename && fields.filename[0]) || "",
            path = "",
            isExist = false;
        //创建切片的临时目录
        let [, HASH] = /^([^_]+)_(\d+)/.exec(filename);
        path = `${uploadDir}/${HASH}`;
        !fs.existsSync(path) ? fs.mkdirSync(path) : null;
        path = `${uploadDir}/${HASH}/${filename}`;
        isExist = await Myexists(path);
        if (isExist) {
            res.send({
                code: 0,
                codeText: "file is exists",
                originalFilename: filename,
                servicePath: path.replace(__dirname, HOSTNAME)
            })
            return;
        }
        writeFile(res, path, file, filename, true);
    } catch (err) {

        res.send({
            code: 1,
            codeText: "error"
        })
    }

    //write File



})

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
const merge = (HASH, count) => {

    return new Promise(async (resolve, reject) => {
        // get path
        let path = `${uploadDir}/${HASH}`,
            fileList = [],
            suffix,
            isExists;

        isExists = await Myexists(path);

        if (!isExists) {
            reject("HASH path is not found!");
            return
        }
        fileList = fs.readdirSync(path);
        //slice not enough for merging
        if (fileList.length < count) {
            reject("the slice has not been uploaded");
            return;
        }
        fileList.sort((a, b) => {
            let reg = /_(\d+)/;
            return reg.exec(a)[1] - reg.exec(b)[1];
        }).forEach(async (item, index) => {

            //根据后缀名，顺序进行合并
            !suffix ? suffix = /\.([0-9a-zA-Z]+)$/.exec(item)[1] : null;
            console.log(1)
            fs.appendFileSync(`${uploadDir}/${HASH}.${suffix}`, fs.readFileSync(`${path}/${item}`));

            fs.unlinkSync(`${path}/${item}`);

        })
        console.log(path)
        fs.rmdirSync(path);
        resolve({
            path: `${uploadDir}/${HASH}.${suffix}`,
            filename: `${HASH}.${suffix}`
        })



    })
}
module.exports = router