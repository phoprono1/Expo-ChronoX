import { Client, Databases, Account, Avatars, ID, Query, Storage, ImageGravity } from 'react-native-appwrite';

// Định nghĩa cấu hình
export const config = {
  endpoint: "http://192.168.1.3/v1",
  platform: "com.hoangpho.chronox",
  projectId: "66d2b51d003002a3b407",
  databaseId: "66d442f4000eac24b59f",
  userCollectionId: "66d442ff0025e0cbcb84",
  storageId: "66d451c900285b152f3e"
};

const {
  endpoint,
  platform,
  projectId,
  databaseId,
  userCollectionId,
  storageId
} = config;

// Khởi tạo client Appwrite
const client = new Client();
// Khởi tạo Storage
const storage = new Storage(client); // Khởi tạo Storage với client

client
  .setEndpoint(config.endpoint) // Sử dụng endpoint từ config
  .setProject(config.projectId) // Sử dụng projectId từ config
  .setPlatform(config.platform); // Sử dụng platform từ config

// Khởi tạo các dịch vụ cần thiết
const databases = new Databases(client);
const account = new Account(client);
const avatars = new Avatars(client);

// Xuất các đối tượng để sử dụng trong ứng dụng
export { client, databases, account, avatars };

// Phương thức tạo người dùng
export const createUser = async (username: string, email: string, password: string) => {
  try {
    // Tạo tài khoản người dùng
    const response = await account.create(ID.unique(), email, password, username);
    console.log('Đăng ký thành công:', response);

    // Lấy avatar mặc định
    const avatar = avatars.getInitials(username, 30, 30);

    console.log(response.$id);

    // Lưu thông tin người dùng vào UserCollections
    const userDocument = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(),
      {
        accountID: response.$id,
        username,
        email,
        avatar,
      }
    );

    console.log('Thông tin người dùng đã được lưu:', userDocument);
  } catch (error) {
    console.error('Đăng ký thất bại:', error);
  }
};

// Phương thức xử lý đăng nhập
export const signInUser = async (email: string, password: string) => {
  try {
    // Tạo phiên đăng nhập cho người dùng
    const response = await account.createEmailPasswordSession(email, password);
    console.log('Đăng nhập thành công:', response);

    // Tạo JWT cho phiên đăng nhập
    const jwtResponse = await account.createJWT();
    const jwt = jwtResponse.jwt; // Lấy token từ phản hồi
    console.log("Token của bạn là:", jwt);

    return jwt; // Trả về token để sử dụng nếu cần
  } catch (error) {
    console.error('Đăng nhập thất bại:', error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Phương thức cập nhật avatar
export const updateAvatar = async (newAvatarUri: string) => {
  try {
    const currentAccount = await account.get();
    const userDocuments = await databases.listDocuments(config.databaseId, config.userCollectionId, [Query.equal("accountID", currentAccount.$id)]);
    
    if (userDocuments.documents.length === 0) {
      throw new Error("Không tìm thấy tài liệu người dùng.");
    }

    const userId = userDocuments.documents[0].$id; // Lấy ID của tài liệu người dùng
    console.log("ID của tài liệu người dùng là:", userId);
    
    const date = new Date().toISOString().split('T')[0]; // Lấy ngày hiện tại
    const fileName = `${currentAccount.name}_${date}.jpg`; // Tạo tên file theo định dạng yêu cầu

    // Tạo đối tượng file cho hàm uploadFile
    const file = {
      uri: newAvatarUri,
      fileName: fileName, // Sử dụng tên file đã tạo
      mimeType: "image/jpeg", // Đảm bảo loại file là image/jpeg
      fileSize: 0, // Kích thước file, có thể cập nhật sau khi fetch
    };

    // Tải ảnh lên Storage và lấy URL
    const avatarUrl = await uploadFile(file); // Kiểm tra xem uploadFile có hoạt động không

    // Cập nhật avatar trong cơ sở dữ liệu
    const updatedDocument = await databases.updateDocument(
      config.databaseId,
      config.userCollectionId,
      userId,
      {
        avatar: avatarUrl // Cập nhật URL của avatar mới
      }
    );

    console.log('Cập nhật avatar thành công:', updatedDocument);
  } catch (error) {
    console.error('Lỗi khi cập nhật avatar:', error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Hàm lấy thông tin người dùng
export const getUserInfo = async () => {
  try {
    const currentAccount = await account.get(); // Lấy thông tin tài khoản hiện tại
    const userDocuments = await databases.listDocuments(config.databaseId, config.userCollectionId, [Query.equal("accountID", currentAccount.$id)]);
    
    if (userDocuments.documents.length > 0) {
      return userDocuments.documents[0]; // Trả về tài liệu người dùng
    }
    throw new Error("Không tìm thấy tài liệu người dùng.");
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Phương thức tải file
export const uploadFile = async(file: { [x: string]: any; uri?: any; fileName?: any; mimeType: any; fileSize?: any; }) => {
  console.log("Đang tải file:", file); // Thêm log để kiểm tra file
  if (!file) return;
  const { mimeType, ...rest } = file;

  // Kiểm tra loại file
  if (!mimeType.startsWith("image/")) { // Kiểm tra xem mimeType có bắt đầu bằng "image/" không
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
          storageId,
          ID.unique(),
          asset
      );

      const fileUrl = await getFilePreview(uploadedFile.$id, "image");

      return fileUrl;
  } catch (error) {
      throw new Error(error as string);
  }
};

export const getFilePreview = async(fileId: string, type: string) => {
  let fileUrl;
  try {
      if (type === "video") {
          fileUrl = storage.getFilePreview(storageId, fileId);
      } else if (type === "image") {
          fileUrl = storage.getFilePreview(
              storageId,
              fileId,
              2000,
              2000,
              ImageGravity.Top,
              100
          );
      } else {
          throw new Error(`Invalid file type: ${type}`); // In ra loại file nếu lỗi
      }

      if (!fileUrl) throw new Error();
      return fileUrl;
  } catch (error) {
      throw new Error(error as string);
  }
};

// Phương thức đăng xuất
export const signOutUser = async () => {
  try {
    await account.deleteSession('current'); // Xóa phiên đăng nhập hiện tại
    console.log('Đăng xuất thành công');
  } catch (error) {
    console.error('Lỗi khi đăng xuất:', error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};
