import LoginRecord from '../models/LoginRecord.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

export const deleteExpiredPhotos = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find records older than 7 days that haven't been processed
    const expiredRecords = await LoginRecord.find({
      loginDate: { $lt: sevenDaysAgo },
      isPhotoDeleted: false
    });

    console.log(`Found ${expiredRecords.length} expired photos to delete`);

    for (const record of expiredRecords) {
      try {
        // Delete from Cloudinary
        const deleteResult = await deleteFromCloudinary(record.cloudinaryPublicId);
        
        if (deleteResult.success) {
          // Mark as deleted in database
          await LoginRecord.findByIdAndUpdate(record._id, {
            isPhotoDeleted: true,
            photoUrl: '' // Clear the URL
          });
          
          console.log(`Deleted photo for record ${record._id}`);
        } else {
          console.error(`Failed to delete photo for record ${record._id}:`, deleteResult.error);
        }
      } catch (error) {
        console.error(`Error processing record ${record._id}:`, error);
      }
    }

    console.log('Photo cleanup completed');
    return { success: true, deletedCount: expiredRecords.length };
  } catch (error) {
    console.error('Photo cleanup error:', error);
    return { success: false, error: error.message };
  }
};