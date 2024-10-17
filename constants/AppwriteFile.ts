import * as FileSystem from "expo-file-system";
import { config } from "./Config";
import { ID } from "react-native-appwrite";
import { storage } from "./AppwriteClient";
const mimeTypeMap: { [key: string]: string } = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "text/plain": "txt",
};

export const getFileUrl = (fileId: string) => {
  return `${config.endpoint}/storage/buckets/${config.storagePostId}/files/${fileId}/view?project=${config.projectId}`;
};

// Hàm lấy URL của tệp từ bucket bài viết
export const getFileFromPostView = async (fileId: string) => {
  try {
    const fileUrl = storage.getFileView(config.storagePostId, fileId); // Sử dụng storagePostId cho bài viết
    if (!fileUrl) throw new Error("Không tìm thấy URL cho tệp.");
    return fileUrl;
  } catch (error) {
    throw new Error(error as string);
  }
};

// Phương thức tải file
export const uploadFile = async (file: {
  [x: string]: any;
  uri?: any;
  fileName?: any;
  mimeType: any;
  fileSize?: any;
}) => {
  console.log("Đang tải file:", file); // Thêm log để kiểm tra file
  if (!file) return;
  const { mimeType, ...rest } = file;

  // Kiểm tra loại file
  if (!mimeType.startsWith("image/")) {
    // Kiểm tra xem mimeType có bắt đầu bằng "image/" không
    throw new Error("Invalid file type"); // Ném lỗi nếu loại file không hợp lệ
  }

  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
  };

  try {
    const uploadedFile = await storage.createFile(
      config.storageAvatarId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFileView(uploadedFile.$id, "image"); // Đổi từ getFilePreview sang getFileView

    return fileUrl;
  } catch (error) {
    throw new Error(error as string);
  }
};

export const getFileView = async (fileId: string, type: string) => {
  // Đổi từ getFilePreview sang getFileView
  let fileUrl;
  try {
    if (type === "video") {
      fileUrl = storage.getFileView(config.storageAvatarId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFileView(config.storageAvatarId, fileId);
    } else {
      throw new Error(`Invalid file type: ${type}`); // In ra loại file nếu lỗi
    }

    if (!fileUrl) throw new Error();
    return fileUrl;
  } catch (error) {
    throw new Error(error as string);
  }
};

// Phương thức tải file lên Storage cho bài viết
export const uploadPostFiles = async (
  files: { uri: string; fileName: string; mimeType: string; fileSize: number }[]
) => {
  const uploadedFiles: { url: string; id: string }[] = []; // Mảng để lưu trữ URL và ID của các file đã tải lên

  for (const file of files) {
    try {
      const uploadedFile = await storage.createFile(
        config.storagePostId, // Sử dụng ID của Storage cho bài viết
        ID.unique(),
        {
          name: file.fileName,
          type: file.mimeType,
          size: file.fileSize,
          uri: file.uri,
        }
      );

      let fileUrl = await getFileFromPostView(uploadedFile.$id); // Lấy URL của file đã tải lên
      uploadedFiles.push({ url: fileUrl.toString(), id: uploadedFile.$id }); // Thêm URL và ID vào mảng
    } catch (error) {
      console.error("Lỗi khi tải file:", error);
      throw error; // Ném lỗi nếu có vấn đề
    }
  }

  return uploadedFiles; // Trả về mảng URL và ID của các file đã tải lên
};

export const getFile = async (fileId: string) => {
  const result = await storage.getFile(config.storagePostId, fileId);
  console.log("result:", result);
  return result;
}

export const getFileDownload = async (fileId: string) => {
  const result = storage.getFileDownload(config.storagePostId, fileId);
  console.log("result:", result);
  return result;
}

export const getFileExtensionFromMimeType = async (
  url: string
): Promise<string | null> => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("Content-Type");
    const mimeType = contentType?.split("/")[1];
    return mimeType || null; // Trả về MIME type
  } catch (error) {
    console.error("Lỗi khi lấy MIME type:", error);
    return null; // Trả về null nếu có lỗi
  }
};

export const downloadFile = async (url: string) => {
  try {
    const { uri, headers } = await FileSystem.downloadAsync(
      url,
      getLocalFilePath(url, "")
    );
    if (!uri) {
      throw new Error("Failed to download file");
    }
    const fileExtension = await getFileExtensionFromMimeType(url);
    const finalLocalFilePath = getLocalFilePath(url, fileExtension || "");
    return { uri: finalLocalFilePath, fileExtension };
  } catch (error) {
    console.error("Lỗi khi tải xuống file:", error);
    throw error;
  }
};

export const getLocalFilePath = (url: string, fileExtension: string) => {
  const fileName = url.split("/").pop() || "file";
  const finalFileName = fileExtension
    ? `${fileName}.${fileExtension}`
    : fileName;
  return `${FileSystem.documentDirectory}${finalFileName}`;
};
