
const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/../.env" });


const mongoURI =
    process.env.NODE_ENV === "test"
        ? process.env.MONGO_URL
        : process.env.MONGO_URI || "mongodb+srv://DevMinds:DevMinds@devminds.vqec0vs.mongodb.net/";


const connectDB = async () => {
  try {

    await mongoose.connect(mongoURI);
    console.log(`MongoDB connected to ${mongoURI}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};


mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});


const gracefulShutdown = () => {
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed due to app termination");
    process.exit(0);
  });
};


process.on("SIGINT", gracefulShutdown); // Ctrl+C
process.on("SIGTERM", gracefulShutdown); // Termination signal (e.g., from Docker)

// Connect to the database
connectDB();

// Export the mongoose instance and the connectDB function
module.exports = {
  mongoose,
  connectDB,
};