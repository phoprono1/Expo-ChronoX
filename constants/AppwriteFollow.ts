import { ID, Query } from "react-native-appwrite";
import { databases } from "./AppwriteClient"; // Import client Appwrite
import { config } from "./Config"; // Import cấu hình

// Tạo hàm kiểm tra và cập nhật trạng thái theo dõi
export const updateFollowStatus = async (
  followerId: string,
  followedId: string
) => {
  try {
    // Kiểm tra xem A đã theo dõi B chưa
    const followAB = await databases.listDocuments(
      config.databaseId,
      config.followCollectionId,
      [Query.equal("follower", followerId), Query.equal("followed", followedId)]
    );

    // Kiểm tra xem B đã theo dõi A chưa
    const followBA = await databases.listDocuments(
      config.databaseId,
      config.followCollectionId,
      [Query.equal("follower", followedId), Query.equal("followed", followerId)]
    );

    // Nếu cả hai đều theo dõi nhau, cập nhật trạng thái thành friend
    if (followAB.documents.length > 0 && followBA.documents.length > 0) {
      // Cập nhật trạng thái cho A -> B
      await databases.updateDocument(
        config.databaseId,
        config.followCollectionId,
        followAB.documents[0].$id, // ID của tài liệu A -> B
        {
          status: "friend",
        }
      );

      // Cập nhật trạng thái cho B -> A
      await databases.updateDocument(
        config.databaseId,
        config.followCollectionId,
        followBA.documents[0].$id, // ID của tài liệu B -> A
        {
          status: "friend",
        }
      );

      console.log("Cập nhật trạng thái thành công: friend");

      // Kiểm tra lại xem hai người dùng có phải là bạn bè không
      const areTheyFriends = await areFriends(followerId, followedId);
      return areTheyFriends; // Trả về kết quả kiểm tra
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái theo dõi:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Tạo hàm follow người dùng
export const followUser = async (followerId: string, followedId: string) => {
  try {
    // Kiểm tra xem đã từng follow chưa
    const existingFollow = await databases.listDocuments(
      config.databaseId,
      config.followCollectionId, // Tên collection
      [Query.equal("follower", followerId), Query.equal("followed", followedId)]
    );

    // Nếu đã từng follow, gọi hàm hủy theo dõi
    if (existingFollow.documents.length > 0) {
      console.log("Bạn đã theo dõi người dùng này trước đó. Hủy theo dõi...");
      await unfollowUser(followerId, followedId); // Gọi hàm hủy theo dõi
      return; // Kết thúc hàm
    }

    // Thêm tài liệu mới vào FollowsCollection
    const followDocument = await databases.createDocument(
      config.databaseId,
      config.followCollectionId, // Tên collection
      ID.unique(), // Tạo ID duy nhất cho tài liệu
      {
        follower: followerId,
        followed: followedId,
        status: "following", // Trạng thái ban đầu
      }
    );

    // Cập nhật số lượng người đã theo dõi trong UsersCollection
    const followerDocument = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("$id", followerId)]
    );
    const currentFolloweds = followerDocument.documents[0].followed || 0;
    await databases.updateDocument(
      config.databaseId,
      config.userCollectionId, // Tên collection
      followerId, // ID của người được theo dõi
      {
        followed: currentFolloweds + 1,
      }
    );

    // Cập nhật số lượng người theo dõi trong UsersCollection
    const statsDocument = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("$id", followedId)]
    );
    const currentFollowers = statsDocument.documents[0].follower || 0;
    await databases.updateDocument(
      config.databaseId,
      config.userCollectionId, // Tên collection
      followedId, // ID của người được theo dõi
      {
        follower: currentFollowers + 1,
      }
    );

    console.log("Theo dõi thành công:", followDocument);

    // Kiểm tra và cập nhật trạng thái nếu cả hai đều theo dõi nhau
    await updateFollowStatus(followerId, followedId);
  } catch (error) {
    console.error(
      "Lỗi khi theo dõi người dùng:" + followerId + " và " + followedId,
      error
    );
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Tạo hàm hủy theo dõi người dùng
export const unfollowUser = async (followerId: string, followedId: string) => {
  try {
    // Tìm tài liệu trong FollowsCollection để xóa
    const existingFollow = await databases.listDocuments(
      config.databaseId,
      config.followCollectionId,
      [Query.equal("follower", followerId), Query.equal("followed", followedId)]
    );

    if (existingFollow.documents.length === 0) {
      console.log("Không tìm thấy mối quan hệ theo dõi để hủy.");
      return;
    }

    // Xóa tài liệu theo dõi
    await databases.deleteDocument(
      config.databaseId,
      config.followCollectionId,
      existingFollow.documents[0].$id // ID của tài liệu cần xóa
    );

    // Cập nhật số lượng người theo dõi trong UsersCollection
    const statsDocument = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("$id", followedId)]
    );
    const currentFollowers = statsDocument.documents[0].follower || 0;
    await databases.updateDocument(
      config.databaseId,
      config.userCollectionId, // Tên collection
      followedId, // ID của người được theo dõi
      {
        follower: currentFollowers - 1,
      }
    );

    // Cập nhật số lượng người đã theo dõi trong UsersCollection
    const followedDocument = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal("$id", followerId)]
    );
    const currentFolloweds = followedDocument.documents[0].followed || 0;
    await databases.updateDocument(
      config.databaseId,
      config.userCollectionId, // Tên collection
      followerId, // ID của người được theo dõi
      {
        followed: currentFolloweds - 1,
      }
    );

    // Kiểm tra trạng thái của mối quan hệ B -> A
    const updateFollowStatus = await databases.listDocuments(
      config.databaseId,
      config.followCollectionId,
      [Query.equal("follower", followedId), Query.equal("followed", followerId)]
    );

    // Kiểm tra xem tài liệu có tồn tại trước khi cập nhật
    if (updateFollowStatus.documents.length > 0) {
      await databases.updateDocument(
        config.databaseId,
        config.followCollectionId,
        updateFollowStatus.documents[0].$id,
        {
          status: "following",
        }
      );
    } else {
      console.log("Không tìm thấy mối quan hệ để cập nhật trạng thái.");
    }

    console.log("Hủy theo dõi thành công.");
  } catch (error) {
    console.error("Lỗi khi hủy theo dõi người dùng:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Tạo hàm kiểm tra xem người dùng hiện tại đã theo dõi người dùng khác hay chưa
export const isFollowing = async (followerId: string, followedId: string) => {
  try {
    const followCheck = await databases.listDocuments(
      config.databaseId,
      config.followCollectionId,
      [Query.equal("follower", followerId), Query.equal("followed", followedId)]
    );

    return followCheck.documents.length > 0; // Trả về true nếu đã theo dõi, false nếu không
  } catch (error) {
    console.error("Lỗi khi kiểm tra theo dõi:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Tạo hàm lấy danh sách bạn bè
export const getFriendsList = async (followerId: string) => {
  try {
    // Lấy danh sách bạn bè với status là "friend"
    const friendsList = await databases.listDocuments(
      config.databaseId,
      config.followCollectionId,
      [Query.equal("follower", followerId), Query.equal("status", "friend")]
    );
    // Trả về danh sách bạn bè
    return friendsList.documents; // Trả về mảng các tài liệu bạn bè
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bạn bè:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

// Tạo hàm kiểm tra xem hai người dùng có phải là bạn bè không
export const areFriends = async (userId1: string, userId2: string) => {
  try {
    // Kiểm tra mối quan hệ từ userId1 đến userId2
    const relation1 = await databases.listDocuments(
      config.databaseId,
      config.followCollectionId,
      [
        Query.equal("follower", userId1),
        Query.equal("followed", userId2),
        Query.equal("status", "friend"),
      ]
    );

    // Kiểm tra mối quan hệ từ userId2 đến userId1
    const relation2 = await databases.listDocuments(
      config.databaseId,
      config.followCollectionId,
      [
        Query.equal("follower", userId2),
        Query.equal("followed", userId1),
        Query.equal("status", "friend"),
      ]
    );

    // Nếu cả hai mối quan hệ đều tồn tại và có trạng thái "friend", thì họ là bạn bè
    console.log(
      "sự kiện kiểm tra tình bạn: ",
      relation1.documents.length > 0 && relation2.documents.length > 0
    );
    return relation1.documents.length > 0 && relation2.documents.length > 0;
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái bạn bè:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};
