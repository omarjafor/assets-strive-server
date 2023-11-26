const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config();
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.21hcnfr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const userCollection = client.db('assetDB').collection('users');
        const customrequestCollection = client.db('assetDB').collection('customrequests');

        // jwt related apis 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token })
        })

        // middleware 
        const verifyToken = (req, res, next) => {
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access' });
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' });
                }
                req.decoded = decoded;
                next();
            })
        }

        // custom request related apis 
        app.get('/customrequests', async(req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await customrequestCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/customrequests', async(req, res) => {
            const customrequest = req.body;
            const result = await customrequestCollection.insertOne(customrequest);
            res.send(result);
        })

        app.patch('/customrequests/:id', async(req, res) => {
            const requestInfo = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id)}
            const updatedDoc = {
                $set: {
                    name: requestInfo.name,
                    whyneed: requestInfo.whyneed,
                    type: requestInfo.type,
                    additional: requestInfo.additional,
                    price: requestInfo.price,
                    image: requestInfo.image
                }
            }
            const result = await customrequestCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // await client.db("admin").command({ ping: 1 });
        // console.log("You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Asset Strive Server is Running')
})

app.listen(port, () => {
    console.log('Asset Strive is Running on port', port);
})