import mongoose from 'mongoose';

// Cache the connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB, using a cached connection if available.
 * This is crucial for serverless environments like Vercel to prevent
 * creating a new connection for every request.
 */
async function connectToDatabase() {
  if (cached.conn) {
    // Use the existing cached connection
    return cached.conn;
  }

  if (!cached.promise) {
    // If no promise exists, create one to connect
    const opts = {
      bufferCommands: false, // Disables Mongoose's buffering
    };
    
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB');
      return mongoose;
    });
  }

  // Await the promise to get the connection
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
