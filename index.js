const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.stripe_secret_key);
const { restart } = require("nodemon");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@hakkani-store.jbxar.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const TCollection = client.db("tools").collection("TCollection");
    const OCollection = client.db("tools").collection("OCollection");
    const UCollection = client.db("tools").collection("UCollection");
    const RCollection = client.db("tools").collection("RCollection");
    const PCollection = client.db("tools").collection("PCollection");
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const emailAddress = await UCollection.findOne({ email: email.email });
      if (emailAddress.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "forbidden" });
      }
    };

    // payment method
    app.post("/create-payment-intent", verifyToken, async (req, res) => {
      const service = req.body;
      const amount = service.price * 100;
      if (service.price) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: "usd",
          payment_method_types: ["card"],
        });
        res.send({ clientSecret: paymentIntent.client_secret });
      }
    });

    // tools collection
    app.get("/tools-collection", async (_, res) => {
      const getData = await TCollection.find().toArray();
      res.send(getData);
    });

    // orders collection
    app.post("/order-collection", async (req, res) => {
      const body = req.body;
      const orders = await OCollection.insertOne(body);
      res.send(orders);
    });

    app.get("/order-collection/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const orders = await OCollection.find({ email }).toArray();
      res.send(orders);
    });
    app.delete("/order-collection/:id", async (req, res) => {
      const id = req.params.id;
      const result = await OCollection.deleteOne({ _id: ObjectId(id) });
      res.send(result);
    });
    app.get("/find-one-order/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await OCollection.find({ _id: ObjectId(id) }).toArray();
      res.send(result);
    });
    app.patch("/payment/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const result = await PCollection.insertOne(payment);
      const updatedOrder = await OCollection.updateOne(filter, updatedDoc);
      res.send(updatedOrder);
    });
    // delete all orders for specific person
    app.delete("/delete-order", async (req, res) => {
      const email = req.query.email;
      const deleteAll = await OCollection.deleteMany({ email, paid: null });
      res.send({ massage: "successfully deleted" });
    });

    // review collection
    app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await RCollection.insertOne(review);
      res.send({ massage: "Thanks for your feedback" });
    });
    app.get("/review", async (req, res) => {
      const result = await RCollection.find().toArray();
      res.send(result);
    });

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
    app.put("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
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
