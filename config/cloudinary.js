// utils/cloudinary.js
import cloudinaryPkg from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";
dotenv.config();

const cloudinary = cloudinaryPkg.v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload buffer (memory) to Cloudinary and return { url, public_id }
export const uploadBufferToCloudinary = (fileBuffer, folder = "profileImages", fileName = "") => {
  return new Promise((resolve, reject) => {
    const opts = { folder, resource_type: "auto" };
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      resolve({ url: result.secure_url, public_id: result.public_id });
    });
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Delete by public_id
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return res;
  } catch (err) {
    throw err;
  }
};

export default cloudinary;
