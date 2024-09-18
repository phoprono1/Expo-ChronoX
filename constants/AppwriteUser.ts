import { account, databases, avatars } from "./AppwriteClient";
import { uploadFile } from "./AppwriteFile";
import { config } from "./Config";
import { ID, Query } from "react-native-appwrite";

export const createUser = async (
  username: string,
  email: string,
  password: string
) => {
  try {
    const response = await account.create(
      ID.unique(),
      email,
      password,
      username
    );
    console.log("Đăng ký thành công:", response);
    const avatar = avatars.getInitials(username, 30, 30);
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

// Các phương thức khác như signInUser, updateAvatar, getUserInfo cũng có thể được thêm vào đây.
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

// Hàm lấy thông tin người dùng dựa trên ID
export const getUserById = async (userId: string) => {
  try {
    const userDocuments = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("accountID", userId)]
    );

    if (userDocuments.documents.length > 0) {
      return userDocuments.documents[0]; // Trả về thông tin người dùng đầu tiên
    } else {
      throw new Error("Không tìm thấy người dùng.");
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    throw error;
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
