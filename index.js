require("dotenv").config();
require("colors");

const stripe = require("stripe")(
  "sk_test_51M60o6JYKMdyVPnVuu9uHHkE81QhCeJfZPottMpPe8nouAWgxD32RjaR0OlkiGI0TF0DnBztleA5kgWdGjxF3xZn00DKbYhkzH"
);

const jwt = require("jsonwebtoken");
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
const ReportedProducts = client.db("LozzeBy").collection("ReportedProducts");
const PaymentRecords = client.db("LozzeBy").collection("PayemntRecords");
const AllUsers = client.db("LozzeBy").collection("AllUsers");

app.post("/create-payment-intent", async (req, res) => {
  const order = req.body;
  const price = order.product_price;
  const amount = price * 100;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    // amount: calculateOrderAmount(items),
    currency: "usd",
    amount: amount,
    payment_method_types: ["card"],
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Access Forbiden" });
    }
    req.decoded = decoded;
    next();
  });
}

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
  const alluser = await AllUsers.insertOne(sellerInfo);
  res.send(result);
});

app.post("/buyers", async (req, res) => {
  const buyerInfo = req.body;
  const result = await Buyers.insertOne(buyerInfo);
  const alluser = await AllUsers.insertOne(buyerInfo);
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

app.get("/users/my-orders/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;
  const decodedEmail = req.decoded.email;
  if (email !== decodedEmail) {
    return res.status(403).send({ message: "Access Forbiden" });
  }
  const query = { email: email };
  const orders = await BuyerOrders.find(query).toArray();
  res.send(orders);
});

app.get("/all-sellers", async (req, res) => {
  const allsellers = await Sellers.find({}).toArray();
  res.send(allsellers);
});

app.get("/all-buyers", verifyJWT, async (req, res) => {
  const allsellers = await Buyers.find({}).toArray();
  res.send(allsellers);
});

app.delete("/users/seller/my-product/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const result = await ResaleProducts.deleteOne(query);
  const deleteQuery = { _id: id };
  const deleteAd = await AdvertiseProducts.deleteOne(deleteQuery);
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
      product_sold: false,
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
      product_sold: true,
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

app.get("/advertise-products", verifyJWT, async (req, res) => {
  const products = await AdvertiseProducts.find({}).toArray();
  res.send(products);
});

app.delete("/users/buyers/delete/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const result = await Buyers.deleteOne(query);
  res.send({
    success: true,
  });
});

app.delete("/users/sellers/delete/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const result = await Sellers.deleteOne(query);
  res.send({
    success: true,
  });
});

app.post("/reported-products", async (req, res) => {
  const product = req.body;
  const result = await ReportedProducts.insertOne(product);
  res.send({ success: true });
});

app.get("/user/order/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const result = await BuyerOrders.findOne(query);
  res.send(result);
});

app.post("/user/order/payment-details", async (req, res) => {
  const paymentDetails = req.body;
  const result = await PaymentRecords.insertOne(paymentDetails);
  const id = paymentDetails.order_id;
  const filter = { _id: ObjectId(id) };
  const updatedDoc = {
    $set: {
      payment_status: true,
      transactionId: paymentDetails.transactionId,
    },
  };
  const updateOrder = await BuyerOrders.updateOne(filter, updatedDoc);
  res.send({ success: true });
});

app.delete("/order/paid/:id", async (req, res) => {
  const id = req.params.id;
  const deleteQuery = { _id: id };
  const deleteAd = await AdvertiseProducts.deleteOne(deleteQuery);
  res.send({ success: true });
});

app.put("/seller/verify/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };
  const options = { upsert: true };
  const updatedDoc = {
    $set: {
      verifyed: true,
    },
  };
  const result = await Sellers.updateOne(filter, updatedDoc, options);
  res.send({ success: true });
});

app.get("/seller/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const result = await Sellers.findOne(query);
  res.send(result);
});

app.get("/reported-product", async (req, res) => {
  const result = await ReportedProducts.find({}).toArray();
  res.send(result);
});

app.delete("/reported-product/delete/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const result = await ResaleProducts.deleteOne(query);
  const deletedReportedProduct = await ReportedProducts.deleteOne({ _id: id });
  const deleteAd = await AdvertiseProducts.deleteOne({ _id: id });
  res.send({ success: true });
});

app.put("/resale-products/payment_status/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: ObjectId(id) };

  const updatedDoc = {
    $set: {
      product_sold: true,
    },
  };
  const result = await ResaleProducts.updateOne(filter, updatedDoc);
  res.send(result);
});

app.get("/buyer-order/product-detail/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
  const result = await ResaleProducts.findOne(query);
  res.send({ result });
});

app.get("/jwt", async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const user = await AllUsers.findOne(query);
  if (user) {
    const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
      expiresIn: "1d",
    });
    return res.send({ accessToken: token });
  }
  res.status(403).send({ message: "Access Denied" });
});

app.get("/check-seller-status/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const user = await Sellers.findOne(query);
  if (user.verifyed) {
    res.send(true);
  }
});

app.listen(port, () => {
  console.log(`Server is listening to port ${port} `.bgCyan);
});
