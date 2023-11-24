const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config();
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Asset Strive Server is Running')
})

app.listen(port, () => {
    console.log('Asset Strive is Running on port', port);
})