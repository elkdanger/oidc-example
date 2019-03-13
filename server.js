require("dotenv").config()

const express = require("express")
const debug = require("debug")("app:server")
const bodyParser = require("body-parser")
const FormData = require("form-data")
const axios = require("axios")
const querystring = require("querystring")
const session = require("express-session")

const app = express()

app.use(
  session({
    name: "demo",
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: false
  })
)

const domain = process.env.DOMAIN
const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET

// axios.interceptors.request.use(request => {
//   debug("axios", request)
//   return request
// })

app.use(
  bodyParser.urlencoded({
    extended: false
  })
)

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

app.get("/login_form", (req, res) => {
  const qs = querystring.stringify({
    client_id: clientId,
    scope: "openid email profile",
    response_type: "token id_token",
    response_mode: "form_post",
    redirect_uri: "http://localhost:3000/callback",
    nonce: 6793823
  })

  const url = `https://${domain}/authorize?${qs}`

  res.redirect(url)
})

app.get("/login_code", (req, res) => {
  const qs = querystring.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "openid email profile",
    response_type: "code",
    nonce: 3456789,
    redirect_uri: "http://localhost:3000/callback"
  })

  const url = `https://${domain}/authorize?${qs}`

  res.redirect(url)
})

// Callback from auth code grant
app.get("/callback", async (req, res) => {
  const code = req.query.code

  debug(code)

  try {
    const postData = querystring.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: "http://localhost:3000/callback"
    })

    const result = await axios({
      method: "post",
      url: `https://${domain}/oauth/token`,
      data: postData,
      config: {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    })

    debug(result.data)

    req.session.loggedIn = true

    const userInfoResult = await axios({
      method: "get",
      url: `https://${domain}/userinfo?access_token=${result.data.access_token}`
    })

    debug(userInfoResult.data)
  } catch (e) {
    debug(e)
  }

  res.redirect("/")
})

// Callback from implicit form post
app.post("/callback", (req, res) => {
  debug(req.body)
  debug("Logged in through implicit form post")

  res.redirect("/")
})

module.exports = app
