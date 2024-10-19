import { databases } from "./AppwriteClient";
import { config } from "./Config";
import { ID, Query } from "react-native-appwrite";
import { uploadFile, uploadPostFiles } from "./AppwriteFile";
import { getUserInfo } from "./AppwriteUser";
// Các phương thức liên quan đến bài viết như thích, không thích, lấy thống kê có thể được thêm vào đây.
// Phương thức tạo bài viết
export const createPost = async (
  mediaUris: string[],
  title: string,
  hashtags: string[]
) => {
  try {
    let uploadedFiles: { id: string }[] = []; // Chỉ lưu ID của file

    // Nếu mediaUris không rỗng, tải file lên Storage
    if (mediaUris && mediaUris.length > 0) {
      const files = mediaUris.map((uri) => {
        const fileExtension = uri.split(".").pop();
        const mimeType = fileExtension === "mp4" ? "video/mp4" : "image/jpeg";

        return {
          uri,
          fileName: `post_${Date.now()}.${fileExtension}`,
          mimeType,
          fileSize: 0,
        };
      });

      // Tải lên tất cả các file và chỉ lấy ID
      uploadedFiles = (await uploadPostFiles(files)).map(file => ({ id: file.id }));
    }

    // Lấy ID của người dùng hiện tại
    const currentUser = await getUserInfo();
    const userId = currentUser.$id;
    // Tạo đối tượng bài viết
    const postDocument = {
      fileIds: uploadedFiles.map((file) => file.id), // Chỉ lưu ID của các file đã tải lên
      title,
      hashtags,
      accountID: userId,
    };

    // Lưu bài viết vào PostCollections
    const response = await databases.createDocument(
      config.databaseId,
      config.postCollectionId,
      ID.unique(),
      postDocument
    );

    const statisticsPostDocument = {
      postCollections: response.$id,
      likes: 0,
      comments: 0,
    };

    await databases.createDocument(
      config.databaseId,
      config.statisticsPostCollectionId,
      ID.unique(),
      statisticsPostDocument
    );

    return response;
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    throw error;
  }
};
// Hàm lấy danh sách bài viết từ mới nhất đến cũ nhất
export const fetchPostsFirst = async (limit: number) => {
  try {
    // Lấy danh sách các bài viết từ PostCollections
    const response = await databases.listDocuments(
      config.databaseId,
      config.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(limit)] // Thêm limit và offset
    );
    // Kiểm tra xem có bài viết nào không
    if (response.documents.length > 0) {
      return response.documents; // Trả về danh sách bài viết
    } else {
      console.log("Không có bài viết nào.");
      return []; // Trả về mảng rỗng nếu không có bài viết
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

export const fetchPostsNext = async (lastID: string, limit: number) => {
  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.postCollectionId,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.cursorAfter(lastID),
      ]
    );

    return response;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết tiếp theo:", error);
    throw error;
  }
};

// Hàm lấy bài viết của người dùng hiện tại
export const fetchUserPostsFirst = async (userId: string, limit: number) => {
  try {
    // Lấy danh sách các bài viết từ PostCollections
    const response = await databases.listDocuments(
      config.databaseId,
      config.postCollectionId,
      [Query.equal("accountID", userId), Query.orderDesc("$createdAt"), Query.limit(limit)] // Thêm limit và offset
    );
    // Kiểm tra xem có bài viết nào không
    if (response.documents.length > 0) {
      return response.documents; // Trả về danh sách bài viết
    } else {
      console.log("Không có bài viết nào.");
      return []; // Trả về mảng rỗng nếu không có bài viết
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

export const fetchUserPostsNext = async (userId: string, lastID: string, limit: number) => {
  try {
    const response = await databases.listDocuments(
      config.databaseId,
      config.postCollectionId,
      [
        Query.equal("accountID", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.cursorAfter(lastID),
      ]
    );
    return response.documents;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết tiếp theo:", error);
    throw error;
  }
};

export const fetchPostById = async (postId: string) => {
  try {
    const response = await databases.getDocument(
      config.databaseId,
      config.postCollectionId,
      postId
    );

    return response;
  } catch (error) {
    console.error("Lỗi khi lấy bài viết theo ID:", error);
    throw error;
  }
};

export const fetchPostByStatisticsId = async (statisticsPostId: string) => {
  try {
    const response = await databases.getDocument(
      config.databaseId,
      config.statisticsPostCollectionId,
      statisticsPostId
    );
    const postId = await fetchPostById(response.postCollections.$id);
    return postId;
  } catch (error) {
    console.error("Lỗi khi lấy bài viết theo ID thống kê:", error);
    throw error;
  }
};

export const toggleLikePost = async (postId: string, userId: string) => {
  try {
    // Kiểm tra xem người dùng đã thích bài viết chưa
    const liked = await isPostLiked(postId, userId);

    if (liked) {
      // Nếu đã thích, gọi hàm hủy thích
      return await unlikePost(postId, userId);
    } else {
      // Nếu chưa thích, gọi hàm thích
      return await likePost(postId, userId);
    }
  } catch (error) {
    console.error("Lỗi khi chuyển đổi trạng thái thích bài viết:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

export const likePost = async (postId: string, userId: string) => {
  try {
    // Tạo tài liệu mới trong postLikeCollection
    const likeDocument = await databases.createDocument(
      config.databaseId,
      config.postLikeCollectionId,
      ID.unique(),
      {
        postCollections: postId,
        userCollections: userId,
      }
    );

    // Cập nhật số lượng likes trong statisticsPostCollection
    const statsDocument = await databases.listDocuments(
      config.databaseId,
      config.statisticsPostCollectionId,
      [Query.equal("postCollections", postId)]
    );

    if (statsDocument.documents.length > 0) {
      const currentLikes = statsDocument.documents[0].likes || 0;
      await databases.updateDocument(
        config.databaseId,
        config.statisticsPostCollectionId,
        statsDocument.documents[0].$id,
        {
          likes: currentLikes + 1, // Tăng số lượng likes
        }
      );
    } else {
      // Nếu không có tài liệu thống kê, tạo mới
      await databases.createDocument(
        config.databaseId,
        config.statisticsPostCollectionId,
        ID.unique(),
        {
          postCollections: postId,
          likes: 1,
          comments: 0, // Khởi tạo số lượng comments
        }
      );
    }

    return likeDocument; // Trả về tài liệu đã tạo
  } catch (error) {
    console.error("Lỗi khi thích bài viết:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

export const getPostStatistics = async (postId: string) => {
  try {
    const statisticsPost = await databases.listDocuments(
      config.databaseId,
      config.statisticsPostCollectionId,
      [Query.equal("postCollections", postId)]
    );
    return statisticsPost.documents[0];
  } catch (error) {
    console.error("Lỗi khi lấy thông tin thống kê bài viết:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Hàm kiểm tra xem người dùng đã thích bài viết chưa
export const isPostLiked = async (postId: string, userId: string) => {
  try {
    const likeDocuments = await databases.listDocuments(
      config.databaseId,
      config.postLikeCollectionId,
      [
        Query.equal("postCollections", postId),
        Query.equal("userCollections", userId),
      ] // Tìm kiếm theo postId và userId
    );
    // Nếu có tài liệu nào được tìm thấy, trả về true, ngược lại trả về false
    return likeDocuments.documents.length > 0;
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái thích bài viết:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

export const unlikePost = async (postId: string, userId: string) => {
  try {
    // Tìm tài liệu thích theo postId và userId
    const likeDocuments = await databases.listDocuments(
      config.databaseId,
      config.postLikeCollectionId,
      [
        Query.equal("postCollections", postId),
        Query.equal("userCollections", userId),
      ]
    );

    if (likeDocuments.documents.length > 0) {
      // Xóa tài liệu thích
      await databases.deleteDocument(
        config.databaseId,
        config.postLikeCollectionId,
        likeDocuments.documents[0].$id // ID của tài liệu thích
      );
      // Cập nhật số lượng likes cho bài viết
      const statisticsPost = await databases.listDocuments(
        config.databaseId,
        config.statisticsPostCollectionId,
        [Query.equal("postCollections", postId)]
      );

      if (statisticsPost.documents.length > 0) {
        let likesCount = statisticsPost.documents[0].likes - 1;

        // Cập nhật tài liệu thống kê bằng ID của tài liệu thống kê
        await databases.updateDocument(
          config.databaseId,
          config.statisticsPostCollectionId,
          statisticsPost.documents[0].$id, // Sử dụng ID của tài liệu thống kê
          {
            likes: likesCount, // Cập nhật số lượng likes
          }
        );
      } else {
        console.error("Không tìm thấy tài liệu thống kê để cập nhật.");
      }
    } else {
      throw new Error("Không tìm thấy tài liệu thích để hủy.");
    }
  } catch (error) {
    console.error("Lỗi khi hủy thích bài viết:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

export const createComment = async (
  postId: string,
  userId: string,
  content: string
) => {
  try {
    // Tạo tài liệu bình luận mới trong commentCollection
    const commentDocument = await databases.createDocument(
      config.databaseId,
      config.commentCollectionId,
      ID.unique(),
      {
        postCollections: postId,
        userCollections: userId,
        comment: content,
      }
    );
    // Cập nhật số lượng comments trong statisticsPostCollection
    const statsDocument = await databases.listDocuments(
      config.databaseId,
      config.statisticsPostCollectionId,
      [Query.equal("postCollections", postId)]
    );

    if (statsDocument.documents.length > 0) {
      const currentComments = statsDocument.documents[0].comments || 0;
      await databases.updateDocument(
        config.databaseId,
        config.statisticsPostCollectionId,
        statsDocument.documents[0].$id,
        {
          comments: currentComments + 1, // Tăng số lượng likes
        }
      );
    } else {
      // Nếu không có tài liệu thống kê, tạo mới
      await databases.createDocument(
        config.databaseId,
        config.statisticsPostCollectionId,
        ID.unique(),
        {
          postCollections: postId,
          comments: 1, // Khởi tạo số lượng comments
        }
      );
    }
    return commentDocument; // Trả về tài liệu bình luận đã tạo
  } catch (error) {
    console.error("Lỗi khi tạo bình luận:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

export const getCommentsByPostId = async (postId: string) => {
  try {
    // Lấy danh sách các bình luận từ commentCollection
    const comments = await databases.listDocuments(
      config.databaseId,
      config.commentCollectionId,
      [Query.equal("postCollections", postId), Query.orderDesc("$createdAt")]
    );
    return comments; // Trả về danh sách bình luận
  } catch (error) {
    console.error("Lỗi khi lấy bình luận:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Hàm lấy số lượng bài viết mà người dùng hiện tại đã đăng
export const getUserPostsCount = async (userId: string) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.postCollectionId,
      [Query.equal("accountID", userId)]
    );

    return posts.documents.length; // Trả về số lượng bài viết
  } catch (error) {
    console.error("Lỗi khi lấy số lượng bài viết:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Hàm lấy danh sách các bài viết mà người dùng đã thích
export const getUserLikedPosts = async (userId: string) => {
  try {
    const likedPosts = await databases.listDocuments(
      config.databaseId,
      config.postLikeCollectionId,
      [Query.equal("userCollections", userId)]
    );
    return likedPosts;
  }
  catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết mà người dùng đã thích:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};
