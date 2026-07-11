import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRETE,
})

const uploadoncloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) return null;

        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto"
        });
        
        console.log("File uploaded successfully to Cloudinary:", response.url);
        
        if (fs.existsSync(localfilepath)) {
            fs.unlinkSync(localfilepath);
        }
        
        return {
            url: response.url,
            public_id: response.public_id
        }
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        if (localfilepath && fs.existsSync(localfilepath)) {
            fs.unlinkSync(localfilepath);
        }
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            console.log("No public_id provided");
            return null;
        }

        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === "ok") {
            console.log("File deleted successfully from Cloudinary:", publicId);
            return result;
        } else if (result.result === "not found") {
            console.log("File not found on Cloudinary:", publicId);
            return null;
        } else {
            console.log("Unexpected response from Cloudinary destroy:", result);
            return null;
        }
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        return null;
    }
};

export { deleteFromCloudinary, uploadoncloudinary };
