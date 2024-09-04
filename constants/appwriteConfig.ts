import {
  Client,
  Databases,
  Account,
  Avatars,
  ID,
  Query,
  Storage,
  ImageGravity,
} from "react-native-appwrite";

// Định nghĩa cấu hình
export const config = {
  endpoint: "https://thrush-proud-primarily.ngrok-free.app/v1",
  platform: "com.hoangpho.chronox",
  projectId: "66d2b51d003002a3b407",
  databaseId: "66d442f4000eac24b59f",
  userCollectionId: "66d442ff0025e0cbcb84",
  storageAvatarId: "66d451c900285b152f3e",
  postCollectionId: "66d875eb001b948d90ae", // Thêm ID của PostCollections
  storagePostId: "66d8782000231bbc2bf9", // Thêm ID của Storage cho mediaUri
};

const {
  endpoint,
  platform,
  projectId,
  databaseId,
  userCollectionId,
  storageAvatarId,
  postCollectionId,
  storagePostId,
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
export const createUser = async (
  username: string,
  email: string,
  password: string
) => {
  try {
    // Tạo tài khoản người dùng
    const response = await account.create(
      ID.unique(),
      email,
      password,
      username
    );
    console.log("Đăng ký thành công:", response);

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

    console.log("Thông tin người dùng đã được lưu:", userDocument);
  } catch (error) {
    console.error("Đăng ký thất bại:", error);
  }
};

// Phương thức xử lý đăng nhập
export const signInUser = async (email: string, password: string) => {
  try {
    // Tạo phiên đăng nhập cho người dùng
    const response = await account.createEmailPasswordSession(email, password);
    console.log("Đăng nhập thành công:", response);

    // Tạo JWT cho phiên đăng nhập
    const jwtResponse = await account.createJWT();
    const jwt = jwtResponse.jwt; // Lấy token từ phản hồi
    console.log("Token của bạn là:", jwt);

    return jwt; // Trả về token để sử dụng nếu cần
  } catch (error) {
    console.error("Đăng nhập thất bại:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Phương thức cập nhật avatar
export const updateAvatar = async (newAvatarUri: string) => {
  try {
    const currentAccount = await account.get();
    const userDocuments = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountID", currentAccount.$id)]
    );

    if (userDocuments.documents.length === 0) {
      throw new Error("Không tìm thấy tài liệu người dùng.");
    }

    const userId = userDocuments.documents[0].$id; // Lấy ID của tài liệu người dùng
    console.log("ID của tài liệu người dùng là:", userId);

    const date = new Date().toISOString().replace(/T/, "_").replace(/\..+/, ""); // Lấy ngày và giờ hiện tại
    const fileName = `${currentAccount.name}_${date}.jpg`; // Tạo tên file theo định dạng yêu cầu

    // Tạo đối tượng file cho hàm uploadFile
    const file = {
      uri: newAvatarUri,
      fileName: fileName, // Sử dụng tên file đã tạo
      mimeType: "image/jpg", // Đảm bảo loại file là image/jpeg
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
        avatar: avatarUrl, // Cập nhật URL của avatar mới
      }
    );

    console.log("Cập nhật avatar thành công:", updatedDocument);
  } catch (error) {
    console.error("Lỗi khi cập nhật avatar:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Hàm lấy thông tin người dùng
export const getUserInfo = async () => {
  try {
    const currentAccount = await account.get(); // Lấy thông tin tài khoản hiện tại
    const userDocuments = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountID", currentAccount.$id)]
    );

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
      storageAvatarId,
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
      fileUrl = storage.getFileView(storageAvatarId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFileView(storageAvatarId, fileId);
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
    await account.deleteSession("current"); // Xóa phiên đăng nhập hiện tại
    console.log("Đăng xuất thành công");
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Phương thức tải file lên Storage cho bài viết
const uploadPostFile = async (file: {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}) => {
  try {
    const uploadedFile = await storage.createFile(
      config.storagePostId, // Sử dụng ID của Storage cho bài viết
      ID.unique(),
      {
        name: file.fileName, // Thay đổi từ fileName thành name
        type: file.mimeType, // Thay đổi từ mimeType thành type
        size: file.fileSize, // Thay đổi từ fileSize thành size
        uri: file.uri, // Giữ nguyên uri
      }
    );

    const fileUrl = await getFileView(
      uploadedFile.$id,
      file.mimeType.startsWith("video") ? "video" : "image"
    ); // Lấy URL của file đã tải lên

    return fileUrl;
  } catch (error) {
    throw new Error(error as string);
  }
};

// Phương thức tạo bài viết
export const createPost = async (
  mediaUri: string,
  title: string,
  hashtags: string[]
) => {
  try {
    // Kiểm tra loại file (video hay ảnh) để lưu với định dạng tương ứng
    const fileExtension = mediaUri.split(".").pop(); // Lấy phần mở rộng của file
    const mimeType = fileExtension === "mp4" ? "video/mp4" : "image/jpeg"; // Xác định loại MIME

    // Tải file lên Storage và lấy URL
    const uploadedFileUrl = await uploadPostFile({
      uri: mediaUri,
      fileName: `post_${Date.now()}.${fileExtension}`, // Tạo tên file duy nhất với phần mở rộng tương ứng
      mimeType: mimeType, // Đảm bảo loại file là đúng
      fileSize: 0, // Kích thước file, có thể cập nhật sau khi fetch
    });

    // Lấy ID của người dùng hiện tại
    const currentUser = await getUserInfo();
    const userId = currentUser.$id; // Lấy ID người dùng
    console.log("id người dùng: " + userId);

    // Tạo đối tượng bài viết
    const postDocument = {
      mediaUri: uploadedFileUrl, // Sử dụng URL của file đã tải lên
      title,
      hashtags,
      accountID: userId, // Lưu ID người dùng trực tiếp
    };

    // Lưu bài viết vào PostCollections
    const response = await databases.createDocument(
      config.databaseId,
      config.postCollectionId, // Sử dụng ID của PostCollections
      ID.unique(), // Tạo ID duy nhất cho bài viết
      postDocument
    );

    console.log("Bài viết đã được lưu:", response);
    return response; // Trả về thông tin bài viết đã lưu
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};
