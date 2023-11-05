const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

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

// database collections

const jobsCollection = client.db('jobsCollection').collection('jobs');

// job-post

app.post('/jobs', async (req, res) => {
 const data = req.body;
 //  console.log(data);
 const result = await jobsCollection.insertOne(data);
 res.send(result);
});

app.get('/jobs', async (req, res) => {
 const result = await jobsCollection.find().toArray();
 res.send(result);
});

app.get('/jobs/:id', async (req, res) => {
 const id = req.params.id;
 const query = { _id: new ObjectId(id) };
 const result = await jobsCollection.findOne(query);
 res.send(result);
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
