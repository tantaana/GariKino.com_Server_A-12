const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());



// -------------------------
//------------------


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.eivtc4s.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access')
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next()
    })
}


async function run() {
    try {
        const categoriesCollection = client.db('usedProducts').collection('categories');
        const productsCollection = client.db('usedProducts').collection('products');
        const usersCollection = client.db('usedProducts').collection('users');

        app.get('/categories', async (req, res) => {
            const query = {};
            const options = await categoriesCollection.find(query).toArray();
            res.send(options)
        })


        app.get('/categoryName', async (req, res) => {
            const query = {};
            const options = await categoriesCollection.find(query).project({ categories: 1 }).toArray();
            res.send(options)
        })

        app.get('/categories/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await categoriesCollection.findOne(query);
            res.send(result)
        })

        app.post('/products', async (req, res) => {
            const products = req.body;
            const result = await productsCollection.insertOne(products);
            res.send(result)
        })

        app.get('/products', async (req, res) => {
            const category = req.query.category;
            const query = { category: category };
            const result = await productsCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/userData', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { email: email };
            const result = await productsCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/userInfo', async (req, res) => {
            const userType = req.query.userType;
            const query = { userType: userType };
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })


        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
            console.log(user)
        })

        app.get('/users/admin/:userType', async (req, res) => {
            const userType = req.params.userType;
            const query = { userType };
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.userType === "Admin" })
        })

        app.get('/users/seller/:userType', async (req, res) => {
            const userType = req.params.userType;
            const query = { userType };
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.userType === "Seller" })
        })

        app.get('/users/buyer/:userType', async (req, res) => {
            const userType = req.params.userType;
            const query = { userType };
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.userType === "Buyer" })
        })

        app.get('/sellers', async (req, res) => {
            const query = {};
            const users = await productsCollection.find(query).toArray();
            res.send(users);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        })

        app.put('/users/info', async (req, res) => {
            const email = req.query.email;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    isVerified: 'verified'
                }
            }
            const result = await productsCollection.update(filter, updatedDoc, options)
            res.send(result)
        })
    }
    finally {

    }
}
run().catch(console.log)

app.get('/', async (req, res) => {
    res.send('valo lagche na ekdom')
})

app.listen(port, () => console.log(`accha vai ${port}`))