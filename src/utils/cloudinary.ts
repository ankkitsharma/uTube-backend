import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async function (localFilePath: string, path) {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      asset_folder: path,
      resource_type: "auto",
    });

    // file has been uploaded successfully
    fs.unlinkSync(localFilePath);
    if (uploadResult) {
      console.log("file has been uploaded successfully: ", uploadResult.url);
      return uploadResult;
    }
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the opload operation got failed
    return null;
  }
};

export const deleteFromCloudinary = async (cloudinaryFilePath, path) => {
  try {
    if (!cloudinaryFilePath) return null;
    // Extract the public ID from the Cloudinary URL
    const avatarPublicId = cloudinaryFilePath.split("/").pop().split(".")[0];

    const response = await cloudinary.uploader.destroy(
      `${path}/${avatarPublicId}`
    );

    if (response.result === "ok") {
      console.log(`File deleted successfully: ${cloudinaryFilePath}`);
      return true;
    } else {
      console.error(`Failed to delete file: ${response.result}`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    return false;
  }
};
