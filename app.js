const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const express = require("express");

const cookieParser = require("cookie-parser");

const app = express();
//middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://task-management-faf4c.web.app/"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(cookieParser());

// Home and health route
app.get("/", (req, res) => {
  res.send("Task Management App");
});
// health
app.get("/health", (req, res) => {
  res.status(200).send("Helth is Good");
});
// Database connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.08atmtx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // await client.connect();
    // ==========================> coupon related related  route implementation <=============================
    // ==========================> coupon related related  route implementation <=============================
    // ==========================> coupon related related  route implementation <=============================
    //* All collections
    const userCollection = client.db("task-management").collection("users");
    const taskCollection = client.db("task-management").collection("tasks");
    // Task api Route ============================================
    // create  task route
    app.post("/task", async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.send(result);
    });
    // get all tasks
    app.get("/tasks", async (req, res) => {
      const cursor = taskCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // Update Task Status

    app.put("/status/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const options = { upsert: true };
      const data = {
        $set: {
          status: req.body.status,
        },
      };
      const result = await taskCollection.updateOne(query, data, options);
      res.send(result);
    });
    // delete task post
    app.delete("/task/:id", async (req, res) => {
      const result = await taskCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });
    // update task route
    app.put("/task/:id", async (req, res) => {
      const query = { _id: new ObjectId(req.params.id) };
      const options = { upsert: true };
      const data = {
        $set: {
          title: req.body.title,
          image: req.body.image,
          description: req.body.description,
          status: req.body.status,
          assignedTo: req.body.assignedTo,
        },
      };
      const result = await taskCollection.updateOne(query, data, options);
      res.send(result);
    });
    // Endpoint to push a new user ID to the assignedTo array of a task
    app.patch("/give/task/:id", async (req, res) => {
      const taskId = req.params.id;
      const userId = req.body.assignedTo; // assuming req.body contains { "assignedTo": "newUserId" }

      try {
        // Update the task by adding the new user ID to the assignedTo array only if it doesn't already exist
        const result = await taskCollection.updateOne(
          { _id: new ObjectId(taskId) },
          { $addToSet: { assignedTo: userId } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Task not found" });
        }

        if (result.modifiedCount === 0) {
          return res
            .status(400)
            .json({ message: "User already assigned to task" });
        }

        res.status(200).json({ message: "User assigned to task successfully" });
      } catch (error) {
        console.error("Error assigning user to task:", error);
        res.status(500).json({ error: "Failed to assign user to task" });
      }
    });

    // get single task
    app.get("/tasks/:id", async (req, res) => {
      const userId = req.params.id;
      try {
        // Fetch all tasks from the collection
        const allTasks = await taskCollection.find().toArray();

        // Filter tasks assigned to the specific user
        const userTasks = allTasks.filter((task) =>
          task.assignedTo.includes(userId)
        );

        // Send the filtered tasks as the response
        res.status(200).json(userTasks);
      } catch (error) {
        // Handle errors
        console.error("Error fetching user tasks:", error);
        res.status(500).json({ error: "Failed to fetch user tasks" });
      }
    });

    // User api Route ============================================
    // create  user route added
    app.post("/users/post", async (req, res) => {
      const newUser = req.body;
      // Check if user already exists based on email
      const existingUser = await userCollection.findOne({
        email: newUser.email,
      });

      console.log(existingUser);
      if (existingUser) {
        // User already exists, send an appropriate response
        return res
          .status(200)
          .json({ message: "User with this email already exists" });
      }
      // Insert the new user if not already existing
      const result = await userCollection.insertOne(newUser);
      res.status(201).send(result);
    });
    // get all users
    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // get single user
    app.get("/users/details/:email", async (req, res) => {
      const result = await userCollection.findOne({
        email: req.params.email,
      });
      res.send(result);
    });
    // get user role
    app.get("/user/role/:email", async (req, res) => {
      const user = await userCollection.findOne({
        email: req.params.email,
      });
      res.send({ role: user.role });
    });
    // Update user role
    app.put("/update/user/role/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const newRole = req.body.role;

        // Ensure the new role is provided
        if (!newRole) {
          return res.status(400).send({ message: "Role is required" });
        }
        // Create the query object to find the user by email
        const query = { email: email };

        // Create the update object to set the new role
        const update = {
          $set: {
            role: newRole,
          },
        };

        // Perform the update operation on the user collection
        const result = await userCollection.updateOne(query, update);

        // Check if the update was successful
        if (result.matchedCount > 0) {
          res.status(200).send({ message: "User role updated successfully" });
        } else {
          res.status(404).send({ message: "User not found" });
        }
      } catch (error) {
        // Handle any errors that occur during the operation
        console.error("Error updating user role:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });
    // delete user
    app.delete("/user/:id", async (req, res) => {
      const result = await userCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.send(result);
    });

    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // ========================<<<<<<<< End >>>>>>>>>>>>>>>>==========================
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port : http://localhost:${port}`);
});
