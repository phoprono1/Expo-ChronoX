import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CreatePost from "@/components/cards/CreatePost";
import CommentInput from "@/components/CommentInput";

const BottomSheetContext = createContext<{
  isVisible: boolean; // Thêm isVisible vào context
  openBottomSheet: (action: "createPost" | "comment", postId?: string) => void;
  closeBottomSheet: () => void;
} | null>(null);

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error("useBottomSheet must be used within a BottomSheetProvider");
  }
  return context;
};

export const BottomSheetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<
    "createPost" | "comment" | null
  >(null); // Thêm state để xác định action
  const [currentPostId, setCurrentPostId] = useState<string | null>(null); // Thêm state để lưu postId
  // Sử dụng useMemo để tính toán snapPoints dựa trên currentAction
  const snapPoints = useMemo(() => {
    return currentAction === "createPost" ? ["90%"] : ["94%"];
  }, [currentAction]);

  const openBottomSheet = (
    action: "createPost" | "comment",
    postId?: string
  ) => {
    setCurrentAction(action);
    setCurrentPostId(postId || null); // Lưu postId nếu có
    setIsVisible(true);
  };

  const closeBottomSheet = () => {
    setIsVisible(false);
    setCurrentAction(null); // Reset action khi đóng
  };

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleCloseBottomSheet = () => {
    bottomSheetRef.current?.close();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  return (
    <GestureHandlerRootView>
      <BottomSheetContext.Provider
        value={{ isVisible, openBottomSheet, closeBottomSheet }} // Cung cấp isVisible
      >
        {children}
        <BottomSheet
          snapPoints={snapPoints} // Sử dụng snapPoints đã tính toán
          ref={bottomSheetRef}
          onClose={closeBottomSheet}
          enablePanDownToClose={true}
          index={isVisible ? 0 : -1} // Đặt index để không che khuất bottom tab
          backdropComponent={renderBackdrop}
        >
          {isVisible && currentAction === 'createPost' && (
            <BottomSheetScrollView>
              <CreatePost
                onPost={(post) => {
                  console.log("New Post:", post);
                  handleCloseBottomSheet();
                }}
              />
            </BottomSheetScrollView>
          )}
          {isVisible && currentAction === 'comment' && (
            <BottomSheetView>
              <CommentInput
                postId={currentPostId || ''} // Truyền postId vào CommentInput
                onSubmit={(comment) => {
                  console.log("New Comment:", comment);
                }}
              />
            </BottomSheetView>
          )}
        </BottomSheet>
      </BottomSheetContext.Provider>
    </GestureHandlerRootView>
  );
};
