const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
        const requestedassetCollection = client.db('assetDB').collection('requestedassets');
        const assetCollection = client.db('assetDB').collection('assets');

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

        // Users Related Apis 
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await userCollection.findOne(query);
            res.send(result);
        })

        app.get('/users/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })

        app.get('/users/employee/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let employee = false;
            if (user) {
                employee = user?.role === 'employee';
            }
            res.send({ employee });
        })

        app.get('/users', async (req, res) => {
            const company = req.query.company;
            const query = { company: company }
            const result = await userCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = { email: user.email }
            const exist = await userCollection.findOne(query);
            if (exist) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // For Admin 
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $unset: {
                    company: '',
                    companylogo: ''
                },
                $set: {
                    role: 'user'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.patch('/users/:id', async (req, res) => {
            const updateUser = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    name: updateUser.name,
                    birthdate: updateUser.birthdate,
                    img: updateUser.img
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // Assets Related Apis 
        app.get('/assets', async (req, res) => {
            const result = await assetCollection.find().toArray();
            res.send(result);
        })

        // For admin 
        app.get('/assets/admin/:company', async (req, res) => {
            const company = req.params.company;
            const query = { company }
            const result = await assetCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/assets/search', async (req, res) => {
            const { query } = req.query;
            const filter = { name: { $regex: query, $options: 'i' } }
            const result = await assetCollection.find(filter).toArray();
            res.send(result);
        })

        app.get('/assets/filter', async (req, res) => {
            const { availability, type } = req.query;
            let quantity = {};
            if (availability === 'Available') {
                quantity = { $gt: 0 }
            } else {
                quantity = 0;
            }
            const filter = { quantity, type }
            const result = await assetCollection.find(filter).toArray();
            res.send(result);
        })

        // for admin 
        app.post('/assets', async (req, res) => {
            const assetInfo = req.body;
            const result = await assetCollection.insertOne(assetInfo);
            res.send(result);
        })

        // For Admin only
        app.patch('/assets/admin/:id', async (req, res) => {
            const assetInfo = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    name: assetInfo.name,
                    quantity: assetInfo.quantity,
                    type: assetInfo.type
                }
            }
            const result = await assetCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // For admin only
        app.delete('/assets/admin/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await assetCollection.deleteOne(query);
            res.send(result);
        })

        // custom request related apis ...............................
        app.get('/customrequests', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await customrequestCollection.find(query).toArray();
            res.send(result);
        })

        // For admin 
        app.get('/customrequests/:company', async (req, res) => {
            const company = req.params.company;
            const query = { company }
            const result = await customrequestCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/customrequests', async (req, res) => {
            const customrequest = req.body;
            const result = await customrequestCollection.insertOne(customrequest);
            res.send(result);
        })

        app.patch('/customrequests/:id', async (req, res) => {
            const requestInfo = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
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

        // For Admin 
        app.patch('/customrequests/admin/:id', async(req, res) => {
            const requestInfo = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id)}
            const updatedDoc = {
                $set: {
                    status: requestInfo.status,
                    approvedate: requestInfo.approvedate,
                    rejectdate: requestInfo.rejectdate 
                }
            }
            const result = await customrequestCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // Requestedassets related apis 
        app.get('/requestedassets', async (req, res) => {
            const result = await requestedassetCollection.aggregate([
                {
                    $group: {
                        _id: "$assetid",
                        count: { $sum: 1 },
                        assetData: { $first: "$$ROOT" }
                    }
                },
                {
                    $match: {
                        count: { $gt: 1 }
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: ["$assetData", { count: "$count" }]
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        assetname: 1,
                        type: 1,
                        email: 1,
                        sendername: 1,
                        requestdate: 1,
                        additionalnote: 1,
                        status: 1,
                        count: 1
                    }
                },
                {
                    $limit: 4
                }
            ]).toArray();
            res.send(result);
        })

        app.get('/requestedassets/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await requestedassetCollection.find(query).toArray();
            res.send(result);
        })

        app.get('/requestedassets/search', async (req, res) => {
            const { query } = req.query;
            console.log(query);
            const filter = { assetname: { $regex: query, $options: 'i' } }
            const result = await requestedassetCollection.find(filter).toArray();
            res.send(result);
        })

        app.get('/requestedassets/filter', async (req, res) => {
            const { status, type } = req.query;
            const filter = { status, type }
            console.log(filter);
            const result = await requestedassetCollection.find(filter).toArray();
            res.send(result);
        })

        // For admin 
        app.get('/requestedassets/admin/:company', async (req, res) => {
            const company = req.params.company;
            const query = { company }
            const result = await requestedassetCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/requestedassets', async (req, res) => {
            const reqasset = req.body;
            const result = await requestedassetCollection.insertOne(reqasset);
            res.send(result);
        })

        app.patch('/requestedassets/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const reqdata = await requestedassetCollection.findOne(filter);
            const assetId = reqdata.assetid
            const quantityUpdate = await assetCollection.updateOne({ _id: new ObjectId(assetId) }, { $inc: { quantity: 1 } })
            console.log(quantityUpdate);
            const updatedDoc = {
                $set: {
                    status: "returned"
                }
            }
            const result = await requestedassetCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // For Admin 
        app.patch('/requestedassets/admin/:id', async(req, res) => {
            const assetInfo = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id)}
            const updatedDoc = {
                $set: {
                    status: assetInfo.status,
                    approvedate: assetInfo.approvedate,
                    rejectdate: assetInfo.rejectdate 
                }
            }
            const result = await requestedassetCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/requestedassets/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await requestedassetCollection.deleteOne(query);
            res.send(result);
        })

        // Payment Intent Stripe 
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        // Payment Data Update To Users 
        app.put('/users/payment', async (req, res) => {
            const userPay = req.body;
            const email = userPay.email;
            const filter = { email: email }
            const user = await userCollection.findOne(filter);
            let updatedLimit = user.limit;
            if (userPay.payment == 5) {
                updatedLimit += 5;
            } else if (userPay.payment == 8) {
                updatedLimit += 10;
            } else if (userPay.payment == 15) {
                updatedLimit += 20;
            }
            const updatedDoc = {
                $set: {
                    payment: userPay.payment,
                    transactionId: userPay.transactionId,
                    date: userPay.date,
                    role: userPay.role,
                    limit: updatedLimit
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc);
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