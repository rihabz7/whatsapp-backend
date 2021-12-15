//importing
import  express  from "express";
import  mongoose  from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";
// app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
  appId: "1315940",
  key: "fa8c9b02b6c71dad05d5",
  secret: "2bb116f0c63ce9e99625",
  cluster: "ap2",
  useTLS: true
});

//middleware

app.use(express.json());
app.use(cors())

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Headers", "*");
//   next();
// });

//DB config
const connection_url = "mongodb+srv://admin:nFu6YLWuo35tewes@cluster0.x4ywn.mongodb.net/whatsappDB?retryWrites=true&w=majority";

mongoose.connect(connection_url,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// pusher
const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected");


const msgCollection = db.collection("messagecontents")
const changeStream = msgCollection.watch()

changeStream.on("change", (change) => {
  console.log("change occured", change);

  if (change.operationType === 'insert'){
    const messageDetails = change.fullDocument;
    pusher.trigger('messages', 'inserted',
    {
      name: messageDetails.name,
      message: messageDetails.message,
      timestamp:messageDetails.timestamp,
      received:messageDetails.received
    }
    );
  } else {
    console.log('error triggering pusher');
  }
});
});
// ????

// api routes
app.get("/", (req, res) => res.status(200).send("hello world"));

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err)
    } else {
      res.status(200).send(data)
    }
  });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;
    Messages.create(dbMessage, (err, data) => {
  if (err) {
    res.status(500).send(err);
  } else {
    res.status(201).send(data);
  }
    });
  });

//listen
app.listen(port,()=>console.log(`listening on localhost:${port}`));