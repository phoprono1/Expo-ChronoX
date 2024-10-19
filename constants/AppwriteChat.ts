import { ID, Query } from "react-native-appwrite";
import { databases } from "./AppwriteClient"; // Import client Appwrite
import { config } from "./Config"; // Import cấu hình

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  VOICE = "voice",
  FILE = "file",
  LOCATION = "location",
  CONTACT = "contact",
  STICKER = "sticker",
  REACTION = "reaction",
  POLL = "poll",
  EVENT = "event",
}

export const sendMessage = async (
  senderId: string | string[],
  receiverId: string | string[],
  message: string,
  messageType: MessageType,
  responseTo?: string // ID của tin nhắn mà tin nhắn này đang trả lời (nếu có)
) => {
  try {
    // Tạo tài liệu mới trong ChatsCollection
    const messageDocument = await databases.createDocument(
      config.databaseId,
      config.chatCollectionId, // Tên collection
      ID.unique(), // Tạo ID duy nhất cho tài liệu
      {
        sender: senderId,
        receiver: receiverId,
        message: message,
        messageType: messageType,
        responseTo: responseTo || null, // Nếu không có, để là null
      }
    );

    console.log("Tin nhắn đã được gửi thành công:", messageDocument);
    return messageDocument; // Trả về tài liệu tin nhắn đã gửi
  } catch (error) {
    console.error("Lỗi khi gửi tin nhắn:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Hàm tải chat với phân trang
export const fetchChats = async (
  userId: string | string[],
  otherUserId: string | string[],
  limit: number,
  lastID?: string | undefined
) => {
  try {
    // Thực hiện truy vấn cho người gửi là userId
    const query1 = [
      Query.and([
        Query.equal("sender", userId), // Lọc theo ID người gửi
        Query.equal("receiver", otherUserId), // Lọc theo ID người nhận
      ]),
      Query.orderDesc("$createdAt"), // Sắp xếp theo thời gian tạo
      Query.limit(limit), // Giới hạn số lượng tin nhắn tải về
    ];

    // Thực hiện truy vấn cho người gửi là otherUserId
    const query2 = [
      Query.and([
        Query.equal("sender", otherUserId), // Lọc theo ID người gửi
        Query.equal("receiver", userId), // Lọc theo ID người nhận
      ]),
      Query.orderDesc("$createdAt"), // Sắp xếp theo thời gian tạo
      Query.limit(limit), // Giới hạn số lượng tin nhắn tải về
    ];

    // Nếu có lastID, thêm cursorAfter để tải tin nhắn tiếp theo
    if (lastID) {
      query1.push(Query.cursorAfter(lastID));
      query2.push(Query.cursorAfter(lastID));
    }

    // Gọi hàm listDocuments cho cả hai truy vấn
    const [response1, response2] = await Promise.all([
      databases.listDocuments(
        config.databaseId,
        config.chatCollectionId,
        query1
      ),
      databases.listDocuments(
        config.databaseId,
        config.chatCollectionId,
        query2
      ),
    ]);

    // Kết hợp kết quả từ cả hai truy vấn
    const combinedChats = [...response1.documents, ...response2.documents];

    // Sắp xếp lại kết quả kết hợp theo thời gian tạo
    const sortedChats = combinedChats.sort(
      (a, b) =>
        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
    );

    // Chỉ lấy số lượng tin nhắn theo limit
    return sortedChats.slice(0, limit); // Trả về danh sách tin nhắn
  } catch (error) {
    console.error("Lỗi khi tải tin nhắn:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

export const getMessageById = async (messageId: string) => {
  try {
    const messageDocument = await databases.getDocument(
      config.databaseId,
      config.chatCollectionId,
      messageId
    );

    return {
      senderId: messageDocument.sender.$id,
      receiverId: messageDocument.receiver.$id,
      text: messageDocument.message,
      timestamp: new Date(messageDocument.$createdAt),
    };
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    return null;
  }
};
