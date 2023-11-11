const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors')
require('dotenv').config()

// Middle ware 
app.use(cors())
app.use(express.json())


// pass
// OzOBj7vXvKuIaxoo


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yzc4fwf.mongodb.net/?retryWrites=true&w=majority`;
console.log({uri})


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  
  
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();

      const menuCollections = client.db('bisstroDB').collection('menu');

        

      app.get('/menu', async(req, res)=> {
        const data = await menuCollections.find({}).toArray();
        res.send(data)
      })

            






      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
  run().catch(console.dir);


app.get('/', (req, res)=> {
    res.send(`<h1 style="color: red; font-size: 2rem; display: flex; align-items: center; justify-content: center; height: 100vh">bisstro boss server is running</h1>`)
})


app.listen(port, ()=> {
    console.log('bisstro boss server is running')
})