require('dotenv').config()
const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)


router.post("/email-verification", (req, res) => {

    const { name, email, userId } = req.body

    const link = "http://localhost:3006/new-sign-up/" + userId

    const msg = {
       from: 'zakariamonre@gmail.com',
       personalizations:[
         {
            to:[
               {
                 email: email
               }
            ],
            dynamic_template_data:{
               name: name,
               url: link,
               subject: name + "Thank You For Joining Us!"
             }
         }
       ],
       template_id: "d-2fc54637597641bf8f2bcd85a31709a8"
    }

  sgMail
    .send(msg)
    .then((e) => {
      console.log(e)
      res.status(201).send("Email sent")
    })
    .catch((error) => {
      console.error(error)
      res.status(500).send("Server Error")
    })

})


router.post("/change-password", async (req, res) => {

   const { email, userId } = req.body

   const link = "http://localhost:3006/reset-password/" + userId

   const msg = {
      from: 'zakariamonre@gmail.com',
      personalizations:[
        {
            to:[
               {
                  email: email
               }
            ],
            dynamic_template_data:{
              url: link,
              subject: "Hi Change"
            }
        }
      ],
      template_id: "d-2138dd5ed56342ef95b7a135ee3f8a34",
      subject: 'Reset Your Password',
   }


  /// return jsonwebtoken ///
  const payload = {
    user: {
      id: userId
    }
  }

  //// the following will return a token generated for the link for 5 Min
  const token = jwt.sign(payload, process.env.USER_JWT_SECRET,
    { expiresIn: 300 },
    (err, token) => {
        if (err) throw err
        return res.json({ token })
    })

  sgMail
    .send(msg)
    .then((e) => {
      console.log(e)
      res.send(token)
    })
    .catch((error) => {
      console.error(error)
      res.status(500).send("Server Error")
    })

})



module.exports = router
