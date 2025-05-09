
const mongoose = require('mongoose');

beforeAll(async () => {

    await mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterAll(async () => {

    await mongoose.connection.close();
});

afterEach(async () => {

    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});