const express = require("express");
const app = express();
var jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();

// Middle ware
app.use(cors());
app.use(express.json());

// pass
// OzOBj7vXvKuIaxoo

let verifyJWT = (req, res, next) => {
  const authorization = req.headers?.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: "unAuthorized Access"})
  }
  const token = authorization.split(' ')[1]
  // console.log({token: token})
  jwt.verify(token, process.env.JWT_TOKEN, (error, decoded)=> {
    if(error){
      return res.status(401).send({error: true, message: "unAuthorized Access"})
    }
    req.decoded = decoded;
    next()
  })
   
}



const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yzc4fwf.mongodb.net/?retryWrites=true&w=majority`;
console.log({ uri });

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const usersCollections = client.db("bisstroBD").collection("users");
    const menuCollections = client.db("bisstroDB").collection("menu");
    const reviewsCollections = client.db("bisstroDB").collection("review");
    const cartCollection = client.db("cart").collection("cart");

    // isAdmin middle ware method 
    const isAdmin = async(req, res, next) => {
        const email = req.decoded?.email;
        const query = {email: email};
        const result =  await usersCollections.findOne(query);
        if(result?.role !== 'admin'){
          res.status(403).send({error: true, meessage: "forbidden access"})
        }
        next()
    }

    // jwt sign in method 
    app.post('/jwt', (req, res)=> {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_TOKEN, { expiresIn: '2hr'});
      res.send(token)
    })

    // all users api method

       //user admin verified method api 
    app.get('/users/admin/:email', verifyJWT, async(req, res)=> {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await usersCollections.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }

      console.log(admin)
      res.send({ admin });
    })



    app.get("/users", verifyJWT, async (req, res) => {
      console.log("click")
      const users = await usersCollections.find().toArray();
      console.log("users", users)
      res.send(users);
    });

    app.post("/users", async (req, res) => {
      const body = req?.body;
      const saveInfo = {
        name: body.displayName,
        email: body?.email,
        uid: body?.uid,
        photo: body?.photoURL,
      };
      // console.log(saveInfo);

      const query = { email: body?.email };
      const existsUser = await usersCollections.findOne(query);
      // console.log({ isexist: existsUser });
      if (existsUser) {
        res.send({ message: `User Already Exists Now` });
      } else {
        const result = await usersCollections.insertOne(saveInfo);
        res.send(result);
      }
    });

    app.delete('/users/:id', async(req, res)=> {
        const emailId = req?.params?.id; 
        const filter = {_id: new ObjectId(emailId)};
        const result = await usersCollections.deleteOne(filter);
        res.send(result)
    })




    // admin role update mehtod API
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params?.id;
      // console.log(id)
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollections.updateOne(filter, updateDoc);
      res.send(result);
    });



    // reviews get API route
    app.get("/review", async (req, res) => {
      const data = await reviewsCollections.find({}).toArray();
      res.send(data);
    });

    // menu get API route
    app.get("/menu", async (req, res) => {
      const data = await menuCollections.find({}).toArray();
      res.send(data);
    });

    //  My cart collection all method
    app.get("/cart", verifyJWT, async (req, res) => {
      const email = req.query?.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };

      const decodedEmail = req.decoded.email; 
      // console.log({decodedEmail: decodedEmail, email: query.email})
      if(query.email !== decodedEmail){
        return res.status(401).send({error: true, message: "unAuthorized Access"})
      }

      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/cart", async (req,  res) => {
      const body = req.body;
      const result = await cartCollection.insertOne(body);
      res.send(result);
    });

    app.delete("/cart/:id", async (req, res) => {
      const cartId = req.params?.id;
      const filter = { _id: new ObjectId(cartId) };
      // console.log({deletedCartId : cartId});
      const result = await cartCollection.deleteOne(filter);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // Await client.close();
  }
}

run().catch(console.dir);



app.get("/", (req, res) => {
  res.send(
    `<h1 style="color: red; font-size: 2rem; display: flex; align-items: center; justify-content: center; height: 100vh">bisstro boss server is running</h1>`
  );
});

app.listen(port, () => {
  console.log("bisstro boss server is running");
});
