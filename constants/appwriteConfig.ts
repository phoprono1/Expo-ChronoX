// import { Share } from "react-native";
// import {
//   Client,
//   Databases,
//   Account,
//   Avatars,
//   ID,
//   Query,
//   Storage,
// } from "react-native-appwrite";
// import * as FileSystem from 'expo-file-system';

// // Định nghĩa cấu hình
// export const config = {
//   endpoint: "http://192.168.1.5/v1",
//   platform: "com.hoangpho.chronox",
//   projectId: "66d2b51d003002a3b407",
//   databaseId: "66d442f4000eac24b59f",
//   userCollectionId: "66d442ff0025e0cbcb84",
//   storageAvatarId: "66d451c900285b152f3e",
//   postCollectionId: "66d875eb001b948d90ae", // Thêm ID của PostCollections
//   storagePostId: "66d8782000231bbc2bf9", // Thêm ID của Storage cho mediaUri
//   postLikeCollectionId: "66e06bab00357c9b30e2",
//   statisticsPostCollectionId: "66e11a2e00314b70f004",
// };

// const {
//   endpoint,
//   platform,
//   projectId,
//   databaseId,
//   userCollectionId,
//   storageAvatarId,
//   postCollectionId,
//   storagePostId,
// } = config;

// // Khởi tạo client Appwrite
// const client = new Client();
// // Khởi tạo Storage
// const storage = new Storage(client); // Khởi tạo Storage với client

// client
//   .setEndpoint(config.endpoint) // Sử dụng endpoint từ config
//   .setProject(config.projectId) // Sử dụng projectId từ config
//   .setPlatform(config.platform); // Sử dụng platform từ config

// // Khởi tạo các dịch vụ cần thiết
// const databases = new Databases(client);
// const account = new Account(client);
// const avatars = new Avatars(client);

// // Xuất các đối tượng để sử dụng trong ứng dụng
// export { client, databases, account, avatars };

// // Phương thức tạo người dùng
// export const createUser = async (
//   username: string,
//   email: string,
//   password: string
// ) => {
//   try {
//     // Tạo tài khoản người dùng
//     const response = await account.create(
//       ID.unique(),
//       email,
//       password,
//       username
//     );
//     console.log("Đăng ký thành công:", response);

//     // Lấy avatar mặc định
//     const avatar = avatars.getInitials(username, 30, 30);

//     console.log(response.$id);

//     // Lưu thông tin người dùng vào UserCollections
//     const userDocument = await databases.createDocument(
//       config.databaseId,
//       config.userCollectionId,
//       ID.unique(),
//       {
//         accountID: response.$id,
//         username,
//         email,
//         avatar,
//       }
//     );

//     console.log("Thông tin người dùng đã được lưu:", userDocument);
//   } catch (error) {
//     console.error("Đăng ký thất bại:", error);
//   }
// };
















// // Đối tượng ánh xạ MIME type với phần mở rộng
// const mimeTypeMap: { [key: string]: string } = {
//   "image/jpeg": "jpg",
//   "image/png": "png",
//   "image/gif": "gif",
//   "application/pdf": "pdf",
//   "video/mp4": "mp4",
//   "text/plain": "txt",
//   // Thêm các MIME type khác nếu cần
// };

// // Hàm lấy phần mở rộng từ MIME type
// export const getFileExtensionFromMimeType = (mimeType: string): string => {
//   const mimeTypeMap: { [key: string]: string } = {
//     "image/jpeg": "jpg",
//     "image/png": "png",
//     "image/gif": "gif",
//     "application/pdf": "pdf",
//     "video/mp4": "mp4",
//     "text/plain": "txt",
//     // Thêm các MIME type khác nếu cần
//   };
//   return mimeTypeMap[mimeType] || ""; // Trả về phần mở rộng nếu có, ngược lại trả về chuỗi rỗng
// };

// // Cập nhật hàm downloadFile để lấy MIME type
// export const downloadFile = async (url: string) => {
//   try {
//     // Tải file về trước để lấy headers
//     const { uri, headers } = await FileSystem.downloadAsync(url, getLocalFilePath(url, '')); // Gọi với phần mở rộng tạm thời
//     if (!uri) {
//       throw new Error("Failed to download file");
//     }

//     // Lấy MIME type từ headers
//     const mimeType = headers['content-type'] || '';
//     const fileExtension = getFileExtensionFromMimeType(mimeType); // Lấy phần mở rộng từ MIME type

//     console.log("uri:", uri);
//     console.log("MIME type:", mimeType);
//     console.log("File extension:", fileExtension);

//     // Cập nhật lại đường dẫn file với phần mở rộng chính xác
//     const finalLocalFilePath = getLocalFilePath(url, fileExtension);

//     return { uri: finalLocalFilePath, fileExtension }; // Trả về đường dẫn file và phần mở rộng
//   } catch (error) {
//     console.error("Lỗi khi tải xuống file:", error);
//     throw error;
//   }
// };

// // Cập nhật hàm getLocalFilePath
// export const getLocalFilePath = (url: string, fileExtension: string) => {
//   const fileName = url.split("/").pop() || "file"; // Lấy tên file từ URL
//   const finalFileName = fileExtension ? `${fileName}.${fileExtension}` : fileName; // Thêm phần mở rộng nếu có

//   console.log("fileName:", finalFileName);
//   return `${FileSystem.documentDirectory}${finalFileName}`;
// };