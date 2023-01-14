const mongoose = require("mongoose")


const UserSchama = new mongoose.Schema({
    fName: {
        type: String,
        required: true
    },
    lName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean
    }
})


module.exports = User = mongoose.model('user', UserSchama)
