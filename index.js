const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 5000;

app.use(
 cors({
  origin: ['http://localhost:5173'],
  credentials: true,
 })
);
app.use(express.json());
app.use(cookieParser());

// middleWare

const logger = (req, res, next) => {
 //  console.log('log info', req.method, req.url);
 next();
};

const verifyToken = (req, res, next) => {
 const token = req?.cookies?.token;
 //  console.log('token in the middleware', token);
 if (!token) {
  return res.status(401).send({ message: 'unauthorized access' });
 }
 jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
  if (err) {
   return res.status(401).send({ message: 'unauthorized access' });
  }
  req.user = decoded;
  next();
 });
};

// mongoDB-start

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uef12ob.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
 serverApi: {
  version: ServerApiVersion.v1,
  strict: true,
  deprecationErrors: true,
 },
});

// jwt

app.post('/jwt', async (req, res) => {
 const user = req.body;
 const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

 res
  .cookie('token', token, {
   httpOnly: true,
   secure: true,
   sameSite: 'none',
  })
  .send({ success: true });
});

app.post('/logout', async (req, res) => {
 const user = req.body;
 res.clearCookie('token', { maxAge: 0 }).send({ success: true });
});

// database collections

const jobsCollection = client.db('jobsCollection').collection('jobs');
const bidsCollection = client.db('bidsCollection').collection('bids');

// job------------api-----------

app.post('/jobs', async (req, res) => {
 try {
  const data = req.body;
  const result = await jobsCollection.insertOne(data);
  res.send(result);
 } catch (error) {
  console.log(error);
 }
});

app.get('/jobs', async (req, res) => {
 try {
  const result = await jobsCollection.find().toArray();
  res.send(result);
 } catch (err) {
  console.log(err.message);
 }
});

app.get('/jobs/:id', async (req, res) => {
 try {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await jobsCollection.findOne(query);
  res.send(result);
 } catch (err) {
  console.log(err);
 }
});
app.get('/jobs', logger, verifyToken, async (req, res) => {
 try {
  // console.log('token owner info', req.user);
  if (req.user?.email !== req.query?.email) {
   return res.status(403).send({ message: 'forbidden access' });
  }
  let query = {};
  if (req.query?.email) {
   query = { email: req.query.email };
  }
  const result = await jobsCollection.find(query).toArray();
  res.send(result);
 } catch (err) {
  console.log(err);
 }
});

app.delete('/jobs/:id', async (req, res) => {
 try {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await jobsCollection.deleteOne(query);
  res.send(result);
 } catch (err) {
  console.log(err);
 }
});

app.patch('/jobs/:id', async (req, res) => {
 try {
  const id = req.params.id;
  const UpdatedBody = req.body;
  const query = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updateDoc = {
   $set: {
    // email: UpdatedBody.email,
    job_title: UpdatedBody.job_title,
    deadline: UpdatedBody.deadline,
    description: UpdatedBody.description,
    category: UpdatedBody.category,
    min_price: UpdatedBody.min_price,
    max_price: UpdatedBody.max_price,
   },
  };
  const result = await jobsCollection.updateOne(query, updateDoc, options);
  res.send(result);
 } catch (err) {
  console.log(err);
 }
});

// bidding--------api----------------

app.post('/bids', async (req, res) => {
 try {
  const data = req.body;
  const result = await bidsCollection.insertOne(data);
  res.send(result);
 } catch (err) {
  console.log(err);
 }
});

// app.get('/bids', async (req, res) => {
//  try {
//   const result = await bidsCollection.find().toArray();

//   res.send(result);
//  } catch (err) {
//   console.log(err.message);
//  }
// });

app.get('/bids', logger, verifyToken, async (req, res) => {
 try {
  if (req.user?.email !== req.query?.email && req.user?.email !== req.query?.buyerEmail) {
   return res.status(403).send({ message: 'forbidden access' });
  }
  console.log(req.query);
  let query = {};

  if (req.query?.buyerEmail) {
   query.buyerEmail = req.query.buyerEmail;
  }

  if (req.query?.email) {
   query.email = req.query.email;
  }

  const result = await bidsCollection.find(query).toArray();
  res.send(result);
 } catch (err) {
  console.log(err);
 }
});

app.patch('/bids/:id', async (req, res) => {
 try {
  const id = req.params.id;
  const UpdatedBody = req.body;
  console.log(UpdatedBody, id);
  const query = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updateDoc = {
   $set: {
    status: UpdatedBody.status,
   },
  };
  const result = await bidsCollection.updateOne(query, updateDoc, options);
  res.send(result);
 } catch (err) {
  console.log(err);
 }
});

async function run() {
 try {
  // Connect the client to the server	(optional starting in v4.7)
  await client.connect();
  // Send a ping to confirm a successful connection
  await client.db('admin').command({ ping: 1 });
  console.log('Pinged your deployment. You successfully connected to MongoDB!');
 } finally {
  // Ensures that the client will close when you finish/error
  //   await client.close();
 }
}
run().catch(console.dir);

// mongoDB-end

app.get('/', (req, res) => {
 res.send('Hello World!');
});

app.listen(port, () => {
 console.log(`Example app listening on port ${port}`);
});
