const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
const jwt = require("jsonwebtoken");
const { restart } = require("nodemon");

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
    const RCollection = client.db("tools").collection("RCollection");

    // tools collection
    app.get("/tools-collection", async (_, res) => {
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
    app.delete("/order-collection/:id", async (req, res) => {
      const id = req.params.id;
      const result = await OCollection.deleteOne({ _id: ObjectId(id) });
      res.send(result);
    });
    // delete all orders for specific person
    app.delete("/delete-order", async (req, res) => {
      const email = req.query.email;
      const deleteAll = await OCollection.deleteMany({ email });
      res.send({ massage: "successfully deleted" });
    });

    // review collection
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await RCollection.insertOne(review);
      res.send({massage:'Thanks for your feedback'})
    });
    app.get('/review', async (req, res)=>{
      const result = await RCollection.find().toArray()
      res.send(result)
    })

    // users collection with both user and admin
    app.get("/users", async (_, res) => {
      const user = await UCollection.find().toArray();
      const order = await OCollection.find().toArray();
      res.send({ user, order });
    });

    app.put("/users", async (req, res) => {
      const email = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: email,
      };
      const result = await UCollection.updateOne(
        { email: email.email },
        updateDoc,
        options
      );
      const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ result, token });
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
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const result = await UCollection.find({ email }).toArray();
      if (result[0]?.role === "admin") {
        res.send(result);
      } else {
        return res.send({ massage: "this person not a admin!" });
      }
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
