require("dotenv").config();
require("colors");

const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.4mqdriq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function dbConnect() {
  try {
    await client.connect();
    console.log("Database Connected ".bgMagenta);
  } catch (error) {
    console.log(error.message.bgRed);
  }
}
dbConnect();

const ProductCategories = client.db("LozzeBy").collection("ProductCategories");
const ResaleProducts = client.db("LozzeBy").collection("ResaleProducts");
const Sellers = client.db("LozzeBy").collection("SellerCollections");
const Buyers = client.db("LozzeBy").collection("BuyersCollections");
const BuyerOrders = client.db("LozzeBy").collection("BuyerOrders");
const Admin = client.db("LozzeBy").collection("Admin");
const AdvertiseProducts = client.db("LozzeBy").collection("AdvertiseProducts");

app.get("/", (req, res) => {
  res.send("Servier Running");
});

app.get("/product-categories", async (req, res) => {
  const categories = await ProductCategories.find({}).toArray();
  res.send(categories);
});

app.get("/category/:id", async (req, res) => {
  const id = req.params.id;
  const query = { category_id: id };
  const products = await ResaleProducts.find(query).toArray();
  res.send(products);
});

app.post("/add-product", async (req, res) => {
  const product = req.body;
  const result = await ResaleProducts.insertOne(product);
  res.send(result);
});

app.post("/sellers", async (req, res) => {
  const sellerInfo = req.body;
  const result = await Sellers.insertOne(sellerInfo);
  res.send(result);
});

app.post("/buyers", async (req, res) => {
  const buyerInfo = req.body;
  const result = await Buyers.insertOne(buyerInfo);
  res.send(result);
});

app.get("/users/seller/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const user = await Sellers.findOne(query);
  res.send({ isSeller: user?.role === "seller" });
});

app.get("/users/buyer/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const user = await Buyers.findOne(query);
  res.send({ isBuyer: user?.role === "buyer" });
});

app.get("/users/admin/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const user = await Admin.findOne(query);
  res.send({ isAdmin: user?.role === "admin" });
});

// app.get("/users/buyer/:email", async (req, res) => {
//   const email = req.params.email;
//   const query = { email: email };
//   const user = await Buyers.findOne(query);

//   if (user?.role === "buyer") {
//     return res.send({ isBuyer: true });
//   }
//   if (user?.role === "admin") {
//     return res.send({ isAdmin: true });
//   }
// });

app.get("/users/seller/products/:email", async (req, res) => {
  const email = req.params.email;
  const query = { seller_email: email };
  const products = await ResaleProducts.find(query).toArray();
  res.send(products);
});

app.post("/buyer-orders", async (req, res) => {
  const orderInfo = req.body;
  const result = await BuyerOrders.insertOne(orderInfo);
  res.send(result);
});

app.get("/users/my-orders/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const orders = await BuyerOrders.find(query).toArray();
  res.send(orders);
});

app.get("/all-sellers", async (req, res) => {
  const allsellers = await Sellers.find({}).toArray();
  res.send(allsellers);
});

app.get("/all-buyers", async (req, res) => {
  const allsellers = await Buyers.find({}).toArray();
  res.send(allsellers);
});

app.delete("/users/seller/my-product/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const result = await ResaleProducts.deleteOne(query);
  res.send({
    success: true,
  });
});

app.put("/users/seller/my-product-available/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const options = { upsert: true };
  const updatedDoc = {
    $set: {
      sell_status: "Available",
    },
  };
  const result = await ResaleProducts.updateOne(filter, updatedDoc, options);
  res.send({ success: true });
});

app.put("/users/seller/my-product-sold/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const options = { upsert: true };
  const updatedDoc = {
    $set: {
      sell_status: "Sold",
    },
  };
  const result = await ResaleProducts.updateOne(filter, updatedDoc, options);
  res.send({ success: true });
});

app.post("/users/seller/my-product-advertise", async (req, res) => {
  const product = req.body;
  const result = await AdvertiseProducts.insertOne(product);
  res.send({ success: true });
});

app.get("/advertise-products", async (req, res) => {
  const products = await AdvertiseProducts.find({}).toArray();
  res.send(products);
});

app.listen(port, () => {
  console.log(`Server is listening to port ${port} `.bgCyan);
});
