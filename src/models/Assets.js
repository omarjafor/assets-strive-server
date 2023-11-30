const { model, Schema } = require("mongoose");

const AssetsData = new Schema({
    "service_id": {
        type: Number,
        required: true
    },
    "author": {
        type: ObjectId,
        ref: "User"

    },
    "title": {
        type: String,
        required: true
    },
    "price": {
        type: Number,
        required: true
    },
    'img': {
        type: String,
        required: true
    },
    "description": {
        type: String,
        required: true
    },
    "facility": [
        {
            "name": {
                type: String,
                required: true
            },
            "details": {
                type: String,
                required: true
            }
        },
    ]
})


const Assets = model("Service", ServiceSchema)

module.exports = Assets



