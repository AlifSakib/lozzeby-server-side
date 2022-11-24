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

app.listen(port, () => {
  console.log(`Server is listening to port ${port} `.bgCyan);
});
