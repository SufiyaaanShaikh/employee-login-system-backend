import mongoose from 'mongoose';

const loginRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  loginDate: {
    type: Date,
    default: Date.now
  },
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  isPhotoDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
loginRecordSchema.index({ userId: 1, loginDate: -1 });
loginRecordSchema.index({ loginDate: -1 });

const LoginRecord = mongoose.model('LoginRecord', loginRecordSchema);
export default LoginRecord;