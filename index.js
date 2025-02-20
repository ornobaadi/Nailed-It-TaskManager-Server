const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xd8rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();

        const taskCollection = client.db('nailDB').collection('tasks');
        const userCollection = client.db('nailDB').collection('users');

        // Users API
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };

            try {
                const existingUser = await userCollection.findOne(query);

                if (existingUser) {
                    return res.send({ message: 'User already exists', insertedId: null });
                }

                const result = await userCollection.insertOne(user);
                res.send({ message: 'New user created', insertedId: result.insertedId });
            } catch (error) {
                console.error('Database error:', error);
                res.status(500).send({ message: 'Server error', error: error.message });
            }
        });

        // Tasks API
        app.post('/tasks', async (req, res) => {
            const task = req.body;

            if (!task.title || !task.email) {
                return res.status(400).send({ message: 'Title and email are required' });
            }

            try {
                const result = await taskCollection.insertOne(task);
                const insertedTask = { ...task, _id: result.insertedId }; // Add _id field
                res.send({ message: 'Task created successfully', task: insertedTask });
            } catch (error) {
                console.error('Database error:', error);
                res.status(500).send({ message: 'Server error', error: error.message });
            }
        });

        app.get('/tasks', async (req, res) => {
            try {
                const result = await taskCollection.find().toArray();
                res.send(result); // _id is automatically included by MongoDB
            } catch (error) {
                console.error('Database error:', error);
                res.status(500).send({ message: 'Server error', error: error.message });
            }
        });

        // Update task category
        app.patch('/tasks/:_id', async (req, res) => {
            const taskId = req.params._id;
            const { category } = req.body;

            if (!category) {
                return res.status(400).send({ message: 'Category is required' });
            }

            try {
                const result = await taskCollection.updateOne(
                    { _id: new ObjectId(taskId) }, // Use _id for querying
                    { $set: { category } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).send({ message: 'Task not found' });
                }

                res.send({ message: 'Task category updated successfully' });
            } catch (error) {
                console.error('Database error:', error);
                res.status(500).send({ message: 'Server error', error: error.message });
            }
        });

        console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Nailing in progress');
});

app.listen(port, () => {
    console.log(`Hammer is nailing on ${port}`);
});