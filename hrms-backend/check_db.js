import mongoose from "mongoose";

const mongoUri = "mongodb://localhost:27017/pulse-hrms";

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected successfully to local MongoDB!");
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:");
    for (let col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
      if (count > 0) {
        const sample = await mongoose.connection.db.collection(col.name).findOne();
        console.log(`  Sample ID:`, sample._id || sample.id);
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
