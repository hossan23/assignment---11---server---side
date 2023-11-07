const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
var jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(
 cors({
  origin: ['http://localhost:5173'],
  credentials: true,
 })
);

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

 res.send({ token });
});

// database collections

const jobsCollection = client.db('jobsCollection').collection('jobs');
const bidsCollection = client.db('bidsCollection').collection('bids');

// job-post-api

app.post('/jobs', async (req, res) => {
 try {
  const data = req.body;

  const result = await jobsCollection.insertOne(data);
  res.send(result);
 } catch (error) {
  console.log(error);
 }
});

// app.get('/jobs', async (req, res) => {
//  const result = await jobsCollection.find().toArray();
//  res.send(result);
// });

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
app.get('/jobs', async (req, res) => {
 try {
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

// bidding api

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
//  const result = await bidsCollection.find().toArray();
//  res.send(result);
// });

app.get('/bids', async (req, res) => {
 try {
  let query = {};
  if (req.query?.email) {
   query = { email: req.query.email };
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
