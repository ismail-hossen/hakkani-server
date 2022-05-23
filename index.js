const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@hakkani-store.jbxar.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const TCollection = client.db('tools').collection('TCollection');
    const OCollection = client.db('tools').collection('OCollection');
    
    app.get('/tools-collection', async (req, res) => {
      const getData = await TCollection.find({}).toArray();
      res.send(getData);
    });

    app.post('/order-collection', async (req, res) => {
      const body = req.body
      const orders = await OCollection.insertOne(body)
      res.send(orders);
    });

  }
  finally {
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('hello world!')
})

app.listen(port, () => {
  console.log(`server running ${port}`)
})