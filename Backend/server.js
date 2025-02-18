process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const adminRoutes = require('./Routes/adminRoute');
const fileRoutes = require('./Routes/fileRoute');
const notificationRoutes = require("./Routes/NotificationRoute");

require('dotenv').config();


require('./config/databaseConnection');

const app = express();


app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use('/api/users', require('./Routes/UserRoute'));

app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
app.disable('etag');

app.use("/api/notifications", notificationRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("******************************************");
  console.log(`Express server running on port ${PORT}`);
  console.log("******************************************");
  console.log("User routes loaded");

});
