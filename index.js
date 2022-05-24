const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@hakkani-store.jbxar.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const TCollection = client.db("tools").collection("TCollection");
    const OCollection = client.db("tools").collection("OCollection");
    const UCollection = client.db("tools").collection("UCollection");

    // tools collection
    app.get("/tools-collection", async (req, res) => {
      const getData = await TCollection.find().toArray();
      res.send(getData);
    });

    // order collection
    app.post("/order-collection", async (req, res) => {
      const body = req.body;
      const orders = await OCollection.insertOne(body);
      res.send(orders);
    });
    app.get("/order-collection/:email", async (req, res) => {
      const email = req.params.email;
      const orders = await OCollection.find({ email }).toArray();
      res.send(orders);
    });

    // users collection with both user and admin
    app.get("/users", async (req, res) => {
      const result = await UCollection.find().toArray();
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const email = req.body;
      const exit = await UCollection.find(email).toArray();

      if (exit[0]?.email === email.email) {
        return res.send({ massage: "this user already have in our database" });
      }
      const result = await UCollection.insertOne(email);
      res.send(result);
    });
    // make admin
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await UCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello world!");
});

app.listen(port, () => {
  console.log(`server running ${port}`);
});
