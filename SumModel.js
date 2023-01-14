const mongoose = require("mongoose")


const SumModelSchama = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true
    }
})


module.exports = SumModel = mongoose.model('summary', SumModelSchama)
