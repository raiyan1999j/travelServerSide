const express = require("express");
const app = express();
const cors= require('cors');
require('dotenv').config();
const nodemailer = require('nodemailer');
const { MongoClient, ServerApiVersion } = require('mongodb');
const stripe = require('stripe')(`${process.env.STRIPE_KEY}`)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sqywi72.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const port = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json());


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
    const database = client.db("travelTicket");
    const newUser = database.collection("newUser");
    const packages= database.collection("packages");
    const offers = database.collection("offers");
    const usual = database.collection("usual");
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // create new user
    app.post('/createUser',async (req,res)=>{
        const container = req.body;
        const result = await newUser.insertOne(container);
    })
    // retrieve specific user authority
    app.get('/userAuthority',async (req,res)=>{
      const {email} = req.query;
      const result = await newUser.findOne({email:email},{projection:{_id:0,email:0}});

      res.send(result);
    })
    // create new event
    app.post('/createEvent',async (req,res)=>{
      const {serviceTitle} = req.query;
      const container = req.body;
      const collection= database.collection(serviceTitle);
      const result = await collection.insertOne(container);
    })
    // retrieve event
    app.get('/retrieveEvent',async (req,res)=>{
      const {serviceTitle} = req.query;
      const collection= database.collection(serviceTitle);
      const result = await collection.find().toArray();

      res.send(result)
    })
    // client payment
    app.post('/clientPayment',async (req,res)=>{
      
      const {amount} = req.body;
      

    
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount * 100,  
        currency: 'bdt',
        automatic_payment_methods: {
          enabled: true,
        }
    })
     
    res.send({clientSecret: paymentIntent.client_secret})
    })
    // send confirmation
    app.post('/confirmation',async(req,res)=>{
      const {amount,mail} = req.query;
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        port:587,
        secure:false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: mail,
      subject: 'Payment Confirmation',
      text: `Thank you for your payment of ${amount}`,
  };
    await transporter.sendMail(mailOptions);
    res.send().status(200)
    })
  } finally {
    // // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log('working or not')
})