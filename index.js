require("dotenv").config();
require("colors");

const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
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

app.get("/", (req, res) => {
  res.send("Servier Running");
});

app.get("/product-categories", async (req, res) => {
  const categories = await ProductCategories.find({}).toArray();
  res.send(categories);
});

app.listen(port, () => {
  console.log(`Server is listening to port ${port} `.bgCyan);
});
