const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// SETUP CLOUDINARY STORAGE WITH MULTER
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let resourceType = "auto";
    return {
      folder: "ClippitAI",
      resource_type: resourceType,
      public_id: file.originalname.split(".")[0],
    };
  },
});

const upload = multer({ storage: storage });

const UploadFileMulter = upload.single("file");
const UploadMultipleFilesMulter = upload.array("files");

const UploadFile = async (req, res, next) => {
  try {
    const fileURL = req.file.path;
    return res.status(200).send(fileURL);
  } catch (err) {
    next({ error: err });
  }
};

const UploadMultipleFiles = async (req, res, next) => {
  try {
    const ids = req.body.ids;
    const fileUrls = req.files.map((file, index) => ({
      id: ids[index],
      url: file.path,
    }));
    return res.status(200).json(fileUrls);
  } catch (err) {
    console.error("Upload error:", err);
    next({ error: err });
  }
};

module.exports = {
  UploadMultipleFilesMulter,
  UploadMultipleFiles,
  UploadFileMulter,
  UploadFile,
};
