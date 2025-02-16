const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/:id", async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const conn = mongoose.connection;
    
    const bucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: "profileImages",
    });

    const files = await bucket.find({ _id: fileId }).toArray();
    
    if (!files.length) {
      return res.status(404).json({ message: "File not found" });
    }

    res.set({
      "Content-Type": files[0].contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });

    const downloadStream = bucket.openDownloadStream(fileId);
    
    downloadStream.on("data", (chunk) => res.write(chunk));
    downloadStream.on("error", () => res.status(500).json({ message: "Error streaming file" }));
    downloadStream.on("end", () => res.end());
    
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid file ID" });
    }
    console.error("Error retrieving file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;